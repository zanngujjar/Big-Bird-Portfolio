"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Header from "@/components/header"
import { API_BASE_URL } from "@/lib/config"
// --- Constants ---
const CANVAS_BG = "#111827"
const AXIS_COLOR = "#9CA3AF"
const GRID_COLOR = "#374151"
const LINE_OPACITY = 0.35
const LABEL_COLOR = "#9CA3AF"
const LABEL_FONT = "12px sans-serif"
const margin = { top: 20, right: 20, bottom: 40, left: 80 };


// --- Helper Functions ---
const formatPrice = (price: number) => {
    if (Math.abs(price) >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`
    if (Math.abs(price) >= 1_000) return `$${(price / 1_000).toFixed(0)}k`
    return `$${price.toFixed(0)}`
}

function getNiceStep(range: number, targetSteps = 5) {
    if (range === 0) return 1;
    const tempStep = range / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(tempStep)));
    const rescaled = tempStep / magnitude;
    if (rescaled > 5) return 10 * magnitude;
    if (rescaled > 2) return 5 * magnitude;
    if (rescaled > 1) return 2 * magnitude;
    return magnitude;
}


export default function SimulationPage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [progress, setProgress] = useState(0)
    const [statusText, setStatusText] = useState("Initializing...");
    const workerRef = useRef<Worker | null>(null);

    const allPathsData = useRef<{ path: any[]; color: string }[]>([]);
    const initialValueRef = useRef<number>(1);
    const minValRef = useRef(Infinity);
    const maxValRef = useRef(-Infinity);

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, minVal: number, maxVal: number) => {
        const iw = w - margin.left - margin.right;
        const ih = h - margin.top - margin.bottom;

        ctx.fillStyle = CANVAS_BG;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(margin.left, margin.top);

        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.fillStyle = LABEL_COLOR;
        ctx.font = LABEL_FONT;

        ctx.textAlign = "center";
        const totalYears = 5;
        for (let i = 0; i <= totalYears; i++) {
            const x = (i / totalYears) * iw;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ih);
            ctx.stroke();
            ctx.fillText(`${i}Y`, x, ih + 25);
        }

        ctx.textAlign = "right";
        const range = maxVal - minVal;
        const step = getNiceStep(range);
        if (range > 0 && step > 0) {
            const startPrice = Math.floor(minVal / step) * step;
            for (let price = startPrice; price <= maxVal; price += step) {
                if (price >= minVal) {
                    const y = ih - ((price - minVal) / range) * ih;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(iw, y);
                    ctx.stroke();
                    ctx.fillText(formatPrice(price), -10, y + 4);
                }
            }
        }

        if (isFinite(minVal) && isFinite(maxVal) && maxVal !== minVal) {
            const initialY = ih - ((initialValueRef.current - minVal) / (maxVal - minVal)) * ih;
            ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = AXIS_COLOR; ctx.lineWidth = 1;
            ctx.moveTo(0, initialY); ctx.lineTo(iw, initialY); ctx.stroke(); ctx.setLineDash([]);
        }

        ctx.strokeStyle = AXIS_COLOR; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, ih); ctx.stroke();
        ctx.restore();
    }

    const drawPath = (ctx: CanvasRenderingContext2D, w: number, h: number, path: any[], color: string, minVal: number, maxVal: number) => {
        const iw = w - margin.left - margin.right;
        const ih = h - margin.top - margin.bottom;
        const maxDay = 252 * 5;
        if (maxVal === minVal) return;
        ctx.save();
        ctx.translate(margin.left, margin.top);
        ctx.strokeStyle = `rgba(${color}, ${LINE_OPACITY})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        path.forEach((pt: any, idx: number) => {
            const x = (pt.day / maxDay) * iw;
            const y = ih - ((pt.value - minVal) / (maxVal - minVal)) * ih;
            if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
    }

    // --- Main Effect for Simulation ---
    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!

        const redrawAll = () => {
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            ctx.scale(dpr, dpr);
            const initial = initialValueRef.current;
            const maxDeviation = Math.max(maxValRef.current - initial, initial - minValRef.current);
            const displayMin = isFinite(maxDeviation) ? initial - maxDeviation : initial * 0.8;
            const displayMax = isFinite(maxDeviation) ? initial + maxDeviation : initial * 1.2;
            drawGrid(ctx, canvas.clientWidth, canvas.clientHeight, displayMin, displayMax);
            allPathsData.current.forEach(({ path, color }) => {
                drawPath(ctx, canvas.clientWidth, canvas.clientHeight, path, color, displayMin, displayMax);
            });
        }

        window.addEventListener('resize', redrawAll);

        const run = async () => {
            try {
                setStatusText("Reading portfolio configuration...");
                const params = new URLSearchParams(window.location.search)
                const allocations = JSON.parse(decodeURIComponent(params.get("allocations") || '{}'))
                const lookback = Number(params.get("lookback")) || 252
                const amount = Number(params.get("amount")) || 100000
                initialValueRef.current = amount;
                minValRef.current = amount;
                maxValRef.current = amount;
                redrawAll();

                setStatusText("Fetching historical price data...");
                const samplePrices: Record<string, number[]> = {};
                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 5);
                const startDateString = startDate.toISOString().split('T')[0];
                await Promise.all(
                    Object.keys(allocations).map(async (ticker) => {
                        const res = await fetch(`${API_BASE_URL}/api/ticker/${ticker}/prices?start_date=${startDateString}`);
                        if (!res.ok) throw new Error(`Failed for ${ticker}: ${res.status}`);
                        const json = await res.json();
                        if (json.success) {
                            samplePrices[ticker] = json.data.map((d: any) => Number(d.close_price)).filter(Boolean);
                        } else {
                            throw new Error(json.error || `API error for ${ticker}`);
                        }
                    })
                );

                setStatusText("Running simulations...");
                const worker = new Worker("/workers/monteCarloWorker.js", { type: "module" });
                workerRef.current = worker;

                worker.postMessage({
                    totalSimulations: 1000,
                    timeSteps: 252 * 5,
                    samplePrices,
                    allocations,
                    lookbackPeriod: lookback,
                    portfolioAmount: amount,
                    batchSize: 10
                });

                worker.onmessage = ({ data }) => {
                    const { progress: prog, batch, done, finalData } = data;
                    setProgress(prog);

                    if (batch) {
                        let scaleChanged = false;
                        batch.forEach((path: any[]) => {
                            const pathMin = Math.min(...path.map(p => p.value));
                            const pathMax = Math.max(...path.map(p => p.value));
                            if (pathMin < minValRef.current) { minValRef.current = pathMin; scaleChanged = true; }
                            if (pathMax > maxValRef.current) { maxValRef.current = pathMax; scaleChanged = true; }
                            const r = 100 + Math.floor(Math.random() * 156);
                            const g = 100 + Math.floor(Math.random() * 156);
                            const b = 100 + Math.floor(Math.random() * 156);
                            allPathsData.current.push({ path, color: `${r},${g},${b}` });
                        });

                        if (scaleChanged) { redrawAll(); }
                        else {
                            const initial = initialValueRef.current;
                            const maxDeviation = Math.max(maxValRef.current - initial, initial - minValRef.current);
                            const displayMin = initial - maxDeviation;
                            const displayMax = initial + maxDeviation;
                            batch.forEach((path: any[], index: number) => {
                                const lastAdded = allPathsData.current[allPathsData.current.length - batch.length + index];
                                drawPath(ctx, canvas.clientWidth, canvas.clientHeight, lastAdded.path, lastAdded.color, displayMin, displayMax);
                            });
                        }
                    }

                    if (done) {
                        setStatusText("Processing results...");
                        worker.terminate();
                        // **FIX:** The logic is now moved to a separate function for clarity.
                        processAndNavigate(allPathsData.current, amount);
                    }
                };
                worker.onerror = (e) => {
                    console.error("Worker Error:", e);
                    setStatusText(`Error: ${e.message}`);
                }
            } catch (e: any) {
                console.error(e);
                setStatusText(`Error: ${e.message}`);
            }
        };
        run();
        return () => {
            window.removeEventListener('resize', redrawAll);
            if (workerRef.current) { workerRef.current.terminate(); }
        };
    }, [router]); // Add router to dependency array to satisfy linting

    const processAndNavigate = (paths: { path: any[] }[], initialAmount: number) => {
        if (!paths || paths.length === 0) {
            console.error("No simulation paths to process. Navigation aborted.");
            return;
        }

        // **FIX:** This function now only saves the final values and initial amount, as expected by the results page.
        const finalValues = paths.map(p => p.path[p.path.length - 1].value);

        sessionStorage.setItem('simulationFinalValues', JSON.stringify(finalValues));
        sessionStorage.setItem('simulationInitialAmount', initialAmount.toString());
        router.push('/results');
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <div className="w-screen px-0 py-4 overflow-x-auto">
                <Card className="bg-gray-900 border-gray-800 mb-4">
                    <CardHeader><CardTitle className="text-white">Simulation Progress</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Progress value={progress} className="w-full" />
                            <span className="text-gray-400 whitespace-nowrap">{statusText}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="bg-gray-900 border-gray-800" style={{ height: 500, minWidth: '1260px' }}>
                    <canvas ref={canvasRef} className="w-full h-full" />
                </div>
            </div>
        </div>
    )
}
