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

    const cy = cytoscape({
      container: cyRef.current,
      elements,
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