// /workers/monteCarloWorker.js
// Final Corrected Monte Carlo Worker with standard Geometric Brownian Motion (GBM) model
// @ts-nocheck

/**
 * Generates a random number from a standard normal distribution.
 * Uses the Box-Muller transform.
 * @returns {number} A random number.
 */
function standardNormalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
* Computes an array of log returns from a price series.
* @param {number[]} prices - Array of historical prices.
* @returns {number[]} Array of log returns.
*/
function computeLogReturns(prices) {
  const logReturns = [];
  for (let i = 1; i < prices.length; i++) {
      if (prices[i] > 0 && prices[i - 1] > 0) {
          logReturns.push(Math.log(prices[i] / prices[i - 1]));
      }
  }
  return logReturns;
}

/**
* Computes the mean (average) of an array of numbers.
* @param {number[]} data - Array of numbers.
* @returns {number} The mean of the array.
*/
function computeMean(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
* Computes the standard deviation of an array of numbers.
* @param {number[]} data - Array of numbers.
* @param {number} mean - The pre-calculated mean of the data.
* @returns {number} The standard deviation.
*/
function computeStdDev(data, mean) {
  if (data.length < 2) return 0;
  const variance = data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (data.length - 1);
  return Math.sqrt(variance);
}


self.onmessage = (e) => {
  const {
      totalSimulations = 1000,
      timeSteps = 252 * 5, // Expecting total days for 5 years
      samplePrices,
      allocations,
      lookbackPeriod = 252, // Defaulting to a more stable 1 year
      portfolioAmount = 100000
  } = e.data;

  const TRADING_DAYS_PER_YEAR = 252;
  const dt = 1 / TRADING_DAYS_PER_YEAR; // The time step for a single day

  // --- Pre-computation Step ---
  const symbols = Object.keys(samplePrices);
  const assetParams = {};

  symbols.forEach(sym => {
      const prices = samplePrices[sym] || [];
      if (prices.length < lookbackPeriod) {
          console.warn(`Insufficient data for ${sym}, using zero drift/volatility.`);
          assetParams[sym] = { drift: 0, volatility: 0, lastPrice: 0, shares: 0 };
          return;
      }

      const relevantPrices = prices.slice(-lookbackPeriod);
      const logReturns = computeLogReturns(relevantPrices);
      const meanReturn = computeMean(logReturns);
      const stdDev = computeStdDev(logReturns, meanReturn);

      const lastPrice = relevantPrices[relevantPrices.length - 1];
      const shares = lastPrice > 0 ? (portfolioAmount * (allocations[sym] / 100)) / lastPrice : 0;
      
      assetParams[sym] = {
          // **FIX:** Calculate annualized drift and volatility from daily data
          drift: meanReturn * TRADING_DAYS_PER_YEAR,
          volatility: stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR),
          lastPrice: lastPrice,
          shares: shares
      };
  });

  const allPaths = [];
  let simulationsCompleted = 0;

  function processOne() {
      const simPath = [];
      const currentPrices = {};
      symbols.forEach(sym => { currentPrices[sym] = assetParams[sym].lastPrice; });

      for (let day = 0; day <= timeSteps; day++) {
          if (day === 0) {
              const initialValue = symbols.reduce((sum, sym) => sum + assetParams[sym].shares * currentPrices[sym], 0);
              simPath.push({ day, value: initialValue });
          } else {
              symbols.forEach(sym => {
                  const { drift, volatility } = assetParams[sym];
                  
                  if (volatility > 0) {
                      // **FIX:** Apply the standard GBM formula with annualized parameters and daily time step (dt)
                      const Z = standardNormalRandom();
                      const exponent = (drift - 0.5 * volatility ** 2) * dt + volatility * Math.sqrt(dt) * Z;
                      currentPrices[sym] *= Math.exp(exponent);
                  }
              });

              const portfolioValue = symbols.reduce((sum, sym) => sum + assetParams[sym].shares * currentPrices[sym], 0);
              simPath.push({ day, value: portfolioValue });
          }
      }
      
      allPaths.push(simPath); 

      simulationsCompleted++;
      const progress = Math.floor((simulationsCompleted / totalSimulations) * 100);
      
      self.postMessage({ progress, batch: [simPath] });
      
      if (simulationsCompleted < totalSimulations) {
          setTimeout(processOne, 0);
      } else {
          // Now that all simulations are done, calculate the final percentile data for the chart
          const finalData = [];
          for (let day = 0; day <= timeSteps; day++) {
              const valuesAtDay = allPaths.map(path => path[day].value);
              valuesAtDay.sort((a, b) => a - b);
              const n = valuesAtDay.length;
              finalData.push({
                  day: day,
                  percentile_5: valuesAtDay[Math.floor(n * 0.05)],
                  percentile_50: valuesAtDay[Math.floor(n * 0.5)],
                  percentile_95: valuesAtDay[Math.floor(n * 0.95)],
              });
          }

          self.postMessage({ progress: 100, finalData: finalData, done: true });
          self.close();
      }
  }

  processOne();
};
