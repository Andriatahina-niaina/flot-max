// CytoscapeGraph.tsx
"use client";

import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import { FlowGraphElement } from "../../types/types";

interface CytoscapeGraphProps {
  elements: FlowGraphElement[];
  stepInfo?: {
    pathFlow: number;
    path: string[];
    description?: string;
    stepNumber?: number;
    totalSteps?: number;
  };
}

const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({ elements, stepInfo }) => {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current || !elements) return;

    // Séparer les nœuds et les arêtes
    const nodes = elements.filter((elem) => !elem.data.source && !elem.data.target);
    const edges = elements.filter((elem) => elem.data.source && elem.data.target);

    // Valider les arêtes
    const validEdges = edges.filter((edge) => {
      const sourceExists = nodes.some((node) => node.data.id === edge.data.source);
      const targetExists = nodes.some((node) => node.data.id === edge.data.target);

      if (!sourceExists) {
        console.warn(`Le nœud source "${edge.data.source}" est manquant pour l'arête : ${edge.data.source} -> ${edge.data.target}`);
      }
      if (!targetExists) {
        console.warn(`Le nœud cible "${edge.data.target}" est manquant pour l'arête : ${edge.data.source} -> ${edge.data.target}`);
      }

      return sourceExists && targetExists;
    });

    const validElements = [...nodes, ...validEdges];

    const cy = cytoscape({
      container: cyRef.current,
      elements: validElements,
      style: [
        // Style de base pour les nœuds
        {
          selector: "node",
          style: {
            label: "data(id)",
            "background-color": "#666",
            "text-valign": "center",
            "text-halign": "center",
            color: "#fff",
            width: 40,
            height: 40,
            "font-size": "12px",
            "border-width": 2,
            "border-color": "#333",
          },
        },
        // Nœud source
        {
          selector: 'node[isSource = "true"]',
          style: {
            "background-color": "#4CAF50",
            "border-color": "#2E7D32",
            "border-width": 3,
          },
        },
        // Nœud puits
        {
          selector: 'node[isSink = "true"]',
          style: {
            "background-color": "#F44336",
            "border-color": "#C62828",
            "border-width": 3,
          },
        },
        // Nœuds dans le chemin actuel
        {
          selector: 'node[isInPath = "true"]',
          style: {
            "background-color": "#FFA500",
            "border-color": "#CC8400",
            "border-width": 4,
            color: "#000",
          },
        },
        // Style de base pour les arêtes
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#999",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#999",
            label: "data(label)",
            "font-size": "11px",
            "text-background-color": "#fff",
            "text-background-opacity": 0.9,
            "text-background-padding": "3px",
            "text-border-width": 1,
            "text-border-color": "#ccc",
            "text-border-style": "solid",
          },
        },
        // Arêtes dans le chemin actuel (orange)
        {
          selector: 'edge[isInPath = "true"]',
          style: {
            width: 5,
            "line-color": "#FFA500",
            "target-arrow-color": "#FFA500",
            "source-arrow-color": "#FFA500",
            "text-background-color": "#FFE0B2",
            "font-weight": "bold",
          },
        },
        // Arêtes saturées (rouge)
        {
          selector: 'edge[saturated = "true"]',
          style: {
            "line-color": "#FF0000",
            "target-arrow-color": "#FF0000",
            "line-style": "solid",
            width: 4,
          },
        },
        // Arêtes bloquées (bleu)
        {
          selector: 'edge[blocked = "true"]',
          style: {
            "line-color": "#0000FF",
            "target-arrow-color": "#0000FF",
            "line-style": "dotted",
            width: 2,
          },
        },
        // Arêtes de retour (gris)
        {
          selector: 'edge[isBackwardEdge = "true"]',
          style: {
            "line-style": "dashed",
            "line-color": "#808080",
            "target-arrow-color": "#808080",
          },
        },
        // Arêtes de retour dans le chemin (orange aussi)
        {
          selector: 'edge[isBackwardEdge = "true"][isInPath = "true"]',
          style: {
            "line-style": "dashed",
            "line-color": "#FFA500",
            "target-arrow-color": "#FFA500",
            width: 5,
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 30,
        spacingFactor: 2,
        avoidOverlap: true,
        circle: false,
        grid: false,
      },
    });

    return () => cy.destroy();
  }, [elements]);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Informations sur l'étape */}
      {stepInfo && (
        <div className="mb-4 space-y-2">
          {stepInfo.stepNumber !== undefined && stepInfo.totalSteps !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Étape {stepInfo.stepNumber} / {stepInfo.totalSteps}
              </span>
              <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stepInfo.stepNumber / stepInfo.totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {stepInfo.description && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
              <div className="text-sm font-medium text-blue-800">
                {stepInfo.description}
              </div>
            </div>
          )}
          
          {stepInfo.path.length > 0 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
              <div className="text-sm font-medium text-green-800">
                Chemin trouvé: {stepInfo.path.join(" → ")}
              </div>
              <div className="text-sm text-green-600">
                Flux du chemin: {stepInfo.pathFlow}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graphique Cytoscape */}
      <div ref={cyRef} style={{ width: "100%", height: "500px" }} />
      
      {/* Légende mise à jour */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Légende :</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border-2 border-green-700"></div>
            <span>Source</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2 border-2 border-red-700"></div>
            <span>Puits</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mr-2 border-2 border-orange-600"></div>
            <span>Chemin actuel</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-1 bg-red-500 mr-2"></div>
            <span>Arête saturée</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-1 bg-blue-500 mr-2"></div>
            <span>Arête bloquée</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-1 bg-gray-500 border-dashed border-t-2 mr-2"></div>
            <span>Arête de retour</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs bg-white border px-2 py-1 rounded mr-2">x/y</span>
            <span>Flot/Capacité</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CytoscapeGraph;