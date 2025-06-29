"use client";

import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { GraphData } from "../../types/types";

type Edge = [string, string];

interface GraphInputFormProps {
  onGraphSubmit: (graph: GraphData) => void;
}

const GraphInputForm: React.FC<GraphInputFormProps> = ({ onGraphSubmit }) => {
  const [source, setSource] = useState<string>("");
  const [sink, setSink] = useState<string>("");
  const [nodes, setNodes] = useState<string>("");
  const [edges, setEdges] = useState<string>("");
  const [capacities, setCapacities] = useState<string>("");

  const [graphData, setGraphData] = useState<GraphData | null>(null);

  const handleSubmit = () => {
    const nodeList = nodes.split(",");
    const edgeList = edges.split(";").map((edge) => edge.split(",") as Edge);
    const capacityList = capacities.split(",").map(Number);
  
    // Vérifier que tous les nœuds dans les arêtes existent dans la liste des nœuds
    const nodeSet = new Set(nodeList);
    for (const [source, target] of edgeList) {
      if (!nodeSet.has(source) || !nodeSet.has(target)) {
        setError(`Erreur : Le nœud "${source}" ou "${target}" est manquant.`);
        return;
      }
    }
  
    const graph: GraphData = {
      nodes: nodeList,
      edges: edgeList,
      capacities: capacityList,
      source,
      sink,
    };
  
    setGraphData(graph);
    onGraphSubmit(graph);
  };
  

  return (
    <div className="flex space-x-6 p-6 bg-white rounded-lg shadow-md">
      <div className="w-1/2">
        <h3 className="text-xl font-bold mb-4">Saisie du graphe</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source :
          </label>
          <InputText
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Puits :
          </label>
          <InputText
            value={sink}
            onChange={(e) => setSink(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nœuds (séparés par des virgules) :
          </label>
          <InputText
            value={nodes}
            onChange={(e) => setNodes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arêtes (format: source,cible;source,cible) :
          </label>
          <InputText
            value={edges}
            onChange={(e) => setEdges(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacités (séparées par des virgules) :
          </label>
          <InputText
            value={capacities}
            onChange={(e) => setCapacities(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <Button
          label="Valider"
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        />
      </div>

      {graphData && (
        <div className="w-1/2">
          <h3 className="text-xl font-bold mb-4">Données du graphe</h3>
          <DataTable value={graphData.edges} className="p-datatable-sm">
            <Column field="0" header="Source"></Column>
            <Column field="1" header="Cible"></Column>
            <Column
              body={(_, { rowIndex }) => graphData.capacities[rowIndex]}
              header="Capacité"
            ></Column>
          </DataTable>
        </div>
      )}
    </div>
  );
};

export default GraphInputForm;
function setError(arg0: string) {
  throw new Error("Function not implemented.");
}

