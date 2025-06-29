// App.tsx
"use client";

import React, { useState } from "react";
import GraphInputForm from "../components/grapheInputForm";
import CytoscapeGraph from "../components/CytoscapeGraph";
import { calculateMaxFlow } from "../lib/fordFulkerson";
import { GraphData, FlowGraphElement } from "../../types/types";
import { Button } from "primereact/button";

const App: React.FC = () => {
  const [graph, setGraph] = useState<GraphData>({ 
    nodes: [], 
    edges: [], 
    capacities: [], 
    source: "", 
    sink: "" 
  });
  const [flowGraph, setFlowGraph] = useState<FlowGraphElement[]>([]);
  const [maxFlow, setMaxFlow] = useState<number>(0);
  const [evolutionSteps, setEvolutionSteps] = useState<any[]>([]);
  const [finalFlowGraph, setFinalFlowGraph] = useState<FlowGraphElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const onGraphSubmit = (graphData: GraphData) => {
    if (!graphData.nodes || !graphData.edges || !graphData.capacities) {
      setError("Données du graphe invalides.");
      return;
    }

    const nodeSet = new Set(graphData.nodes);
    for (const [source, target] of graphData.edges) {
      if (!nodeSet.has(source) || !nodeSet.has(target)) {
        setError(`Erreur : Le nœud "${source}" ou "${target}" est manquant.`);
        return;
      }
    }

    setGraph(graphData);
    initializeFlowGraph(graphData);
    setError(null);
    setIsCalculated(false);
    setEvolutionSteps([]);
    setMaxFlow(0);
  };

  const initializeFlowGraph = (graphData: GraphData) => {
    const elements: FlowGraphElement[] = [];

    // Ajouter les nœuds
    graphData.nodes.forEach((node) => {
      elements.push({ 
        data: { 
          id: node,
          isSource: node === graphData.source,
          isSink: node === graphData.sink,
        } 
      });
    });

    // Ajouter les arêtes
    graphData.edges.forEach(([source, target], index) => {
      if (!graphData.nodes.includes(source) || !graphData.nodes.includes(target)) {
        console.error(`Erreur : Le nœud source (${source}) ou cible (${target}) est introuvable.`);
        return;
      }
      elements.push({
        data: {
          id: `${source}-${target}`,
          source: source,
          target: target,
          capacity: graphData.capacities[index],
        },
      });
    });

    setFlowGraph(elements);
  };

  const handleCalculateMaxFlow = () => {
    if (!graph.source || !graph.sink) {
      setError("Veuillez spécifier une source et un puits.");
      return;
    }

    const { maxFlow, steps, finalGraph } = calculateMaxFlow(
      graph.nodes,
      graph.edges,
      graph.capacities,
      graph.source,
      graph.sink
    );

    setMaxFlow(maxFlow);
    setEvolutionSteps(steps);
    setFinalFlowGraph(finalGraph);
    setCurrentStepIndex(0);
    setIsCalculated(true);
  };

  const handlePreviousStep = () => {
    setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
  };

  const handleNextStep = () => {
    setCurrentStepIndex(Math.min(evolutionSteps.length - 1, currentStepIndex + 1));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Algorithme de Ford-Fulkerson
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration du Graphe</h2>
        <GraphInputForm onGraphSubmit={onGraphSubmit} />
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {flowGraph.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Graphe Initial</h2>
          <CytoscapeGraph elements={flowGraph} />
          
          <div className="mt-4 flex justify-center">
            <Button 
              label="Calculer le flot maximum" 
              onClick={handleCalculateMaxFlow} 
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isCalculated}
            />
          </div>
        </div>
      )}

      {isCalculated && evolutionSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Évolution de l'Algorithme
            </h2>
            <div className="flex items-center space-x-4">
              <Button 
                label="← Précédent" 
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              />
              <span className="text-sm font-medium">
                Étape {currentStepIndex + 1} / {evolutionSteps.length}
              </span>
              <Button 
                label="Suivant →" 
                onClick={handleNextStep}
                disabled={currentStepIndex === evolutionSteps.length - 1}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              />
            </div>
          </div>
          
          {evolutionSteps[currentStepIndex] && (
            <CytoscapeGraph 
              elements={evolutionSteps[currentStepIndex].elements}
              stepInfo={{
                pathFlow: evolutionSteps[currentStepIndex].pathFlow,
                path: evolutionSteps[currentStepIndex].path,
              }}
            />
          )}
        </div>
      )}

      {maxFlow > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Résultat Final</h2>
          <div className="text-3xl font-bold text-blue-600 mb-4">
            Flot Maximum : {maxFlow}
          </div>
          <div className="text-gray-600">
            Algorithme terminé en {Math.floor(evolutionSteps.length / 2)} itérations
          </div>
        </div>
      )}
    </div>
  );
};

export default App;