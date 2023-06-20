// tree.tsx
import React from 'react';

const Tree = ({ data, onNodeFieldChange, onRemoveNode, onAddValueNode, onAddConditionalNode }) => {
  const renderTreeNodes = (nodes) => {
    return nodes.map((node) => {
      if (node.type === 'ConditionalNode') {
        return renderConditionalNode(node);
      } else if (node.type === 'ValueNode') {
        return renderValueNode(node);
      }
      return null;
    });
  };

  const renderConditionalNode = (node) => {
    return (
      <li key={node.id}>
        <div>
          <select
            value={node.operator}
            onChange={(e) => onNodeFieldChange(node.id, 'operator', e.target.value)}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button title="Remove conditional node" onClick={() => onRemoveNode(node.id)}>−</button>
          <button title="Add conditional node" onClick={() => onAddConditionalNode(node.id)}>+</button>
        </div>
        {node.children && node.children.length > 0 && (
          <ul>
            {renderTreeNodes(node.children)}
            <button title="Add value node" onClick={() => onAddValueNode(node.id)}>+</button>
          </ul>
        )}
      </li>
    );
  };

  const renderValueNode = (node) => {
    return (
      <li key={node.id}>
        <div>
          <input
            type="text"
            value={node.tag}
            onChange={(e) => onNodeFieldChange(node.id, 'tag', e.target.value)}
          />
          <select
            value={node.operator}
            onChange={(e) => onNodeFieldChange(node.id, 'operator', e.target.value)}
          >
            <option value="equals">equals</option>
            <option value="greaterThan">greaterThan</option>
            <option value="lessThan">lessThan</option>
            <option value="contains">contains</option>
          </select>
          <input
            type="text"
            value={node.value}
            onChange={(e) => onNodeFieldChange(node.id, 'value', e.target.value)}
          />
          <button title="Remove value node" onClick={() => onRemoveNode(node.id)}>−</button>
        </div>
      </li>
    );
  };

  return <ul>{renderTreeNodes(data)}</ul>;
};

export default Tree;
