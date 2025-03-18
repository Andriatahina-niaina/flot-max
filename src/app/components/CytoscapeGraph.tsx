"use client";

import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import { FlowGraphElement } from "../../types/types";

interface CytoscapeGraphProps {
  elements: FlowGraphElement[];
}

const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({ elements }) => {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current) return;

    // Séparer les nœuds et les arêtes
    const nodes = elements.filter((elem) => elem.data.id); // Les nœuds ont `data.id`
    const edges = elements.filter((elem) => elem.data.source && elem.data.target); // Les arêtes ont `data.source` et `data.target`

    // Valider les arêtes : vérifier que les nœuds source et target existent
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

    // Combiner les nœuds et les arêtes valides
    const validElements = [...nodes, ...validEdges];

    // Initialiser Cytoscape
    const cy = cytoscape({
      container: cyRef.current,
      elements: validElements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(id)",
            "background-color": "#666",
            "text-valign": "center",
            "text-halign": "center",
            color: "#fff",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#999",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            label: "data(capacity)",
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 10,
      },
    });

    return () => cy.destroy();
  }, [elements]);

  return <div ref={cyRef} style={{ width: "100%", height: "400px" }}></div>;
};

export default CytoscapeGraph;