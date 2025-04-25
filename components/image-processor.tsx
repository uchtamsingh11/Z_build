'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function ImageProcessor() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setProcessedImageUrl(null); // Reset processed image when a new image is selected
    }
  };

  // Process the image to remove the TradingView watermark
  const processImage = () => {
    if (!imageUrl || !canvasRef.current || !outputCanvasRef.current) return;
    
    setIsProcessing(true);
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // Set up input canvas
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Set up output canvas
      const outputCanvas = outputCanvasRef.current!;
      const outputCtx = outputCanvas.getContext('2d')!;
      outputCanvas.width = img.width;
      outputCanvas.height = img.height;
      outputCtx.drawImage(img, 0, 0);
      
      // Define the watermark area (bottom-left corner)
      // TradingView watermark is typically in the bottom left
      const watermarkX = 0;
      const watermarkY = img.height - 100; // Cover a larger area to ensure complete hiding
      const watermarkWidth = 200; // Make it very wide to cover the entire logo and text
      const watermarkHeight = 100; // Make it tall enough to cover the entire watermark with extra margin
      
      // Implement content-aware fill for the watermark area
      removeWatermark(outputCtx, watermarkX, watermarkY, watermarkWidth, watermarkHeight, img);
      
      // Convert the processed canvas to a data URL
      const processedDataUrl = outputCanvas.toDataURL('image/png');
      setProcessedImageUrl(processedDataUrl);
      setIsProcessing(false);
    };
    
    img.src = imageUrl;
  };

  // Function to remove watermark by applying a solid color patch
  const removeWatermark = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number,
    img: HTMLImageElement
  ) => {
    // Simple approach: Sample the chart background color and create a solid patch
    
    // Create a 10x10 grid to sample multiple background colors from the chart
    const sampleColors: number[][] = [];
    const sampleSize = 10;
    
    // Sample colors from the right side of the chart (away from the watermark)
    const rightSideX = Math.min(img.width - sampleSize - 5, img.width / 2);
    const middleY = img.height / 2;
    
    // Get the image data for the sampling area
    const sampleData = ctx.getImageData(rightSideX, middleY, sampleSize, sampleSize);
    
    // Calculate the average color
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = sampleSize * sampleSize;
    
    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      totalR += sampleData.data[offset];
      totalG += sampleData.data[offset + 1];
      totalB += sampleData.data[offset + 2];
    }
    
    // Calculate average background color
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);
    
    // Apply a completely opaque layer to ensure the watermark is hidden
    ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
    ctx.globalAlpha = 1.0;
    ctx.fillRect(x, y, width, height);
    
    // Handle grid lines by sampling from above and extending them down
    const drawGridLines = () => {
      // Sample a row from above the watermark to detect grid line positions
      const gridSampleY = Math.max(0, y - 5);
      const gridSample = ctx.getImageData(x, gridSampleY, width, 1);
      
      // Detect potential grid line positions
      const gridPositions: number[] = [];
      for (let i = 0; i < width; i++) {
        const offset = i * 4;
        const pixelBrightness = (gridSample.data[offset] + gridSample.data[offset + 1] + gridSample.data[offset + 2]) / 3;
        
        // If this pixel is darker than the background, it might be a grid line
        if (pixelBrightness < (avgR + avgG + avgB) / 3 - 10) {
          gridPositions.push(i);
        }
      }
      
      // Draw vertical grid lines
      ctx.strokeStyle = `rgba(${Math.max(0, avgR-30)}, ${Math.max(0, avgG-30)}, ${Math.max(0, avgB-30)}, 0.5)`;
      ctx.lineWidth = 1;
      
      for (const pos of gridPositions) {
        ctx.beginPath();
        ctx.moveTo(x + pos + 0.5, y);
        ctx.lineTo(x + pos + 0.5, y + height);
        ctx.stroke();
      }
      
      // Add subtle horizontal grid lines
      for (let gridY = 0; gridY < height; gridY += 10) {
        ctx.beginPath();
        ctx.moveTo(x, y + gridY + 0.5);
        ctx.lineTo(x + width, y + gridY + 0.5);
        ctx.stroke();
      }
    };
    
    // Draw grid lines over the solid color patch
    drawGridLines();
  };

  // Download the processed image
  const downloadImage = () => {
    if (!processedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = image ? `processed-${image.name}` : 'processed-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white font-mono uppercase tracking-wider">Image Watermark Remover</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="image-upload" className="text-zinc-400">Upload TradingView Chart</Label>
          <Input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="bg-zinc-950 border-zinc-800 text-zinc-300"
          />
        </div>
        
        {imageUrl && (
          <div className="space-y-4">
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Original Image</h3>
              <div className="relative border border-zinc-800 rounded-md overflow-hidden">
                <canvas ref={canvasRef} className="max-w-full h-auto hidden" />
                <img src={imageUrl} alt="Original" className="max-w-full h-auto" />
              </div>
            </div>
            
            {processedImageUrl ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Processed Image (Watermark Removed)</h3>
                <div className="relative border border-zinc-800 rounded-md overflow-hidden">
                  <canvas ref={outputCanvasRef} className="max-w-full h-auto hidden" />
                  <img src={processedImageUrl} alt="Processed" className="max-w-full h-auto" />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <canvas ref={outputCanvasRef} className="max-w-full h-auto hidden" />
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-zinc-800 pt-4">
        <Button 
          onClick={processImage} 
          disabled={!imageUrl || isProcessing}
          className="bg-zinc-800 hover:bg-zinc-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Remove Watermark'
          )}
        </Button>
        
        {processedImageUrl && (
          <Button 
            onClick={downloadImage}
            variant="outline"
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            Download Processed Image
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
