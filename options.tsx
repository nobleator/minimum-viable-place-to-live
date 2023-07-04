// options.tsx
import React from 'react';
import { useStorage } from "@plasmohq/storage/hook"
import Tree from './tree';

export const STORAGE_KEY = "mvptl-tree";

function OptionsIndex() {
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
          tag: 'newTag',
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
              tag: 'newTag',
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
    <div>
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
    </div>
  );
}

export default OptionsIndex;
