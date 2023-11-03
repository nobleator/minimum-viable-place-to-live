import React from 'react';
import { useStorage } from "@plasmohq/storage/hook"
import Tree from './tree';

export const STORAGE_KEY = "mvptl-tree";

const handlePurge = () => {
  if (confirm("Are you sure you want to purge your browser storage?")) {
    chrome.storage.sync.clear();
    chrome.storage.local.clear();  
  }
}

const handleLoadPersona = (persona, setTreeData) => {
  if (confirm(`Would you like to replace your settings with the ${persona} persona?`)) {
    let treeData: any;
    switch (persona) {
      case "family": {
        treeData = {
          lastModified: Date.now(),
          data: [
            {
              "id": 1,
              "type": "ConditionalNode",
              "operator": "AND",
              "children": [
                {
                  "id": 1689593778325,
                  "type": "ValueNode",
                  "tagKey": "school",
                  "tagValue": "elementary",
                  "operator": "lessThan",
                  "value": "1000"
                },
                {
                  "id": 1689593779351,
                  "type": "ValueNode",
                  "tagKey": "shop",
                  "tagValue": "grocery",
                  "operator": "lessThan",
                  "value": "5000"
                },
                {
                  "id": 1689900486428,
                  "type": "ValueNode",
                  "tagKey": "leisure",
                  "tagValue": "park",
                  "operator": "lessThan",
                  "value": "1000"
                }
              ]
            }
          ]
        };
        break;
      }
      case "athlete": {
        treeData = {
          lastModified: Date.now(),
          data: [
            {
              "id": 1,
              "type": "ConditionalNode",
              "operator": "AND",
              "children": [
                {
                  "id": 1689593778325,
                  "type": "ValueNode",
                  "tagKey": "amenity",
                  "tagValue": "gym",
                  "operator": "lessThan",
                  "value": "1000"
                },
                {
                  "id": 1689593779351,
                  "type": "ValueNode",
                  "tagKey": "landuse",
                  "tagValue": "sport",
                  "operator": "lessThan",
                  "value": "5000"
                },
                {
                  "id": 1689900486428,
                  "type": "ValueNode",
                  "tagKey": "leisure",
                  "tagValue": "park",
                  "operator": "lessThan",
                  "value": "1000"
                },
                {
                  "id": 1689901926342,
                  "type": "ConditionalNode",
                  "operator": "OR",
                  "children": [
                    {
                      "id": 1689901926343,
                      "type": "ValueNode",
                      "tagKey": "name",
                      "tagValue": "Whole Foods",
                      "operator": "lessThan",
                      "value": "4000"
                    },
                    {
                      "id": 1689901926344,
                      "type": "ValueNode",
                      "tagKey": "brand",
                      "tagValue": "Trader Joe's",
                      "operator": "lessThan",
                      "value": "6000"
                    }
                  ]
                }
              ]
            }
          ]
        };
        break;
      }
      default: {
        break;
      }
    }
    
    setTreeData(treeData);
  }
}

function IndexPopup() {
  // TODO: send message to background when tree is modified to re-evaluate & propogate to content
  const [treeData, setTreeData] = useStorage(STORAGE_KEY, {
    lastModified: Date.now(),
    data: [
      {
        id: 1,
        type: 'ConditionalNode',
        operator: 'AND',
        children: []
      }
    ]
  });

  const handlePrintTree = () => {
    console.log(treeData);
  };

  const handleNodeFieldChange = (nodeId, field, newValue) => {
    setTreeData((prevTreeData) => {
      return {
        ...prevTreeData,
        lastModified: Date.now(),
        data: updateNodeField(prevTreeData.data, nodeId, field, newValue)
      };
    });
  };

  const handleRemoveNode = (nodeId) => {
    setTreeData((prevTreeData) => {
      return {
        ...prevTreeData,
        lastModified: Date.now(),
        data: removeNode(prevTreeData.data, nodeId)
      };
    });
  };

  const handleAddValueNode = (parentId) => {
    setTreeData((prevTreeData) => {
      return {
        ...prevTreeData,
        lastModified: Date.now(),
        data: addNode(prevTreeData.data, parentId, 'ValueNode')
      };
    });
  };

  const handleAddConditionalNode = (parentId) => {
    setTreeData((prevTreeData) => {
      return  {
        ...prevTreeData,
        lastModified: Date.now(),
        data: addConditionalNode(prevTreeData.data, parentId)
      };
    });
  };

  const updateNodeField = (nodes, nodeId, field, newValue) => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        // TODO: Handle objects as fields
        return { ...node, [field]: newValue };
      } else if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeField(node.children, nodeId, field, newValue) };
      }
      return node;
    });
  };

  const removeNode = (nodes, nodeId) => {
    return nodes.filter((node) => {
      if (node.id === nodeId) {
        return false;
      } else if (node.children && node.children.length > 0) {
        node.children = removeNode(node.children, nodeId);
        return true;
      }
      return true;
    });
  };

  const addNode = (nodes, parentId, nodeType) => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        const newNode = {
          id: Date.now(),
          type: nodeType,
          tagKey: 'newTagKey',
          tagValue: 'newTagValue',
          operator: 'equals',
          value: 'newValue',
        };
        if (node.children) {
          node.children.push(newNode);
        } else {
          node.children = [newNode];
        }
      } else if (node.children && node.children.length > 0) {
        node.children = addNode(node.children, parentId, nodeType);
      }
      return node;
    });
  };

  const addConditionalNode = (nodes, parentId) => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        const newConditionalNode = {
          id: Date.now(),
          type: 'ConditionalNode',
          operator: 'AND',
          children: [
            {
              id: Date.now() + 1,
              type: 'ValueNode',
              tagKey: 'newTagKey',
              tagValue: 'newTagValue',
              operator: 'equals',
              value: 'newValue',
            },
          ],
        };
        if (node.children) {
          node.children.push(newConditionalNode);
        } else {
          node.children = [newConditionalNode];
        }
      } else if (node.children && node.children.length > 0) {
        node.children = addConditionalNode(node.children, parentId);
      }
      return node;
    });
  };

  return (
    <div
      style={{
        width: 800,
      }}>
      <h1>Settings</h1>
      <span>Last modified: {treeData.lastModified}</span>
      <Tree
        data={treeData.data}
        onNodeFieldChange={handleNodeFieldChange}
        onRemoveNode={handleRemoveNode}
        onAddValueNode={handleAddValueNode}
        onAddConditionalNode={handleAddConditionalNode}
      />
      <button onClick={handlePrintTree}>Print Tree</button>
      <button onClick={handlePurge}>Purge</button>
      <button onClick={() => handleLoadPersona("family", setTreeData)}>Load Persona: Family</button>
      <button onClick={() => handleLoadPersona("athlete", setTreeData)}>Load Persona: Athlete</button>
    </div>
  )
}

export default IndexPopup
