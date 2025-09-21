import { api } from "encore.dev/api";
import db from "../db";

interface OGRequest { id: string }
interface OGResponse { svg: string }

// Simple SVG-based OG image generator
function generateOGImage(title: string, subhead: string, biasLeft: number, biasCenter: number, biasRight: number): string {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Pastel backdrop -->
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F7F5F2;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#CFE8CF;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#FFE5B4;stop-opacity:0.2" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- Subtle grid -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A3B18A" stroke-width="0.5" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#grid)" />
      
      <!-- Main content area -->
      <rect x="80" y="80" width="1040" height="470" fill="white" rx="24" opacity="0.95" />
      
      <!-- Title -->
      <text x="120" y="180" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="bold" fill="#1f2937" text-anchor="start">
        <tspan x="120" dy="0">${title.slice(0, 60)}${title.length > 60 ? '...' : ''}</tspan>
      </text>
      
      <!-- Subhead -->
      <text x="120" y="240" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#6b7280" text-anchor="start">
        <tspan x="120" dy="0">${subhead.slice(0, 80)}${subhead.length > 80 ? '...' : ''}</tspan>
      </text>
      
      <!-- Bias Analysis Label -->
      <text x="120" y="320" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#374151" text-anchor="start">
        Bias Analysis
      </text>
      
      <!-- Bias bars -->
      <rect x="120" y="340" width="${(biasLeft / 100) * 400}" height="32" fill="#3b82f6" rx="4" />
      <rect x="${120 + (biasLeft / 100) * 400}" y="340" width="${(biasCenter / 100) * 400}" height="32" fill="#84a98c" rx="4" />
      <rect x="${120 + ((biasLeft + biasCenter) / 100) * 400}" y="340" width="${(biasRight / 100) * 400}" height="32" fill="#ef4444" rx="4" />
      
      <!-- Bias percentages -->
      <text x="${120 + (biasLeft / 200) * 400}" y="362" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">
        ${biasLeft}%
      </text>
      <text x="${120 + (biasLeft / 100) * 400 + (biasCenter / 200) * 400}" y="362" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">
        ${biasCenter}%
      </text>
      <text x="${120 + ((biasLeft + biasCenter) / 100) * 400 + (biasRight / 200) * 400}" y="362" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">
        ${biasRight}%
      </text>
      
      <!-- Bias labels -->
      <text x="120" y="400" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#3b82f6" text-anchor="start">Left</text>
      <text x="320" y="400" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#84a98c" text-anchor="middle">Center</text>
      <text x="520" y="400" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#ef4444" text-anchor="end">Right</text>
      
      <!-- Branding -->
      <text x="120" y="480" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="#A3B18A" text-anchor="start">
        Explain the News
      </text>
      <text x="120" y="510" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#6b7280" text-anchor="start">
        AI-powered news analysis and bias detection
      </text>
    </svg>
  `;
  
  return svg;
}

export const ogImage = api<OGRequest, OGResponse>(
  { expose: true, method: "GET", path: "/api/og/:id" },
  async ({ id }) => {
    try {
      // Get article data
      const rows = await db.query/*sql*/`
        SELECT 
          tldr_headline, tldr_subhead, 
          bias_left, bias_center, bias_right
        FROM articles 
        WHERE id = ${id} 
        LIMIT 1
      `;

      const rowsArray = [];
      for await (const row of rows) {
        rowsArray.push(row);
      }

      if (rowsArray.length === 0) {
        // Return a default OG image
        const defaultSvg = generateOGImage(
          "Article Not Found",
          "This article may have expired or doesn't exist",
          33, 34, 33
        );
        
        return { svg: defaultSvg };
      }

      const article = rowsArray[0];
      const svg = generateOGImage(
        String(article.tldr_headline || "News Analysis"),
        String(article.tldr_subhead || "AI-powered breakdown"),
        Number(article.bias_left || 33),
        Number(article.bias_center || 34),
        Number(article.bias_right || 33)
      );

      return { svg };
    } catch (error) {
      console.error("OG image generation error:", error);
      
      // Return fallback image
      const fallbackSvg = generateOGImage(
        "Explain the News",
        "AI-powered news analysis",
        33, 34, 33
      );
      
      return { svg: fallbackSvg };
    }
  }
);