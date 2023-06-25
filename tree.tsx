// tree.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncCreatableSelect from 'react-select/async-creatable';
import Select from 'react-select';

interface Option {
  readonly value: string;
  readonly label: string;
}

const logicalOperatorOptions: readonly Option[] = [
  { value: 'AND', label: 'AND', },
  { value: 'OR', label: 'OR', },
];

const arthimeticOperatorOptions: readonly Option[] = [
  { value: 'equals', label: 'equals', },
  { value: 'greaterThan', label: 'greaterThan', },
  { value: 'lessThan', label: 'lessThan', },
];

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
        <div style={{display: 'flex'}}>
          <Select
            value={{value: node.operator, label: node.operator}}
            options={logicalOperatorOptions}
            onChange={(e) => onNodeFieldChange(node.id, 'operator', e.value)}
          />
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

  const filterRegions = async (inputValue: string) => {
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/region/`);
      const matchingOptions = response.data.results.map((region) => ({
        value: region.name,
        label: region.name,
      }));
      
      return matchingOptions.filter((i) => i.label.toLowerCase().includes(inputValue.toLowerCase()));
    } catch (error) {
      console.log('Error fetching regions:', error);
      return [];
    }
  };
  
  const promiseOptions = async (inputValue: string) => {
    try {
      return await filterRegions(inputValue);;
    } catch (error) {
      console.log('Error fetching regions:', error);
      return [];
    }
  };

  const renderValueNode = (node) => {
    return (
      <li key={node.id}>
        <div style={{display: 'flex'}}>
          <AsyncCreatableSelect
            cacheOptions
            defaultOptions
            value={{value: node.tag, label: node.tag}}
            loadOptions={promiseOptions}
            onChange={(e: any) => onNodeFieldChange(node.id, 'tag', e.value)}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                display: 'flex',
              }),
            }}
          />
          <Select
            value={{value: node.operator, label: node.operator}}
            options={arthimeticOperatorOptions}
            onChange={(e) => onNodeFieldChange(node.id, 'operator', e.value)}
          />
          <input
            type="number"
            style={{
              borderColor: 'hsl(0, 0%, 80%)',
              borderRadius: '4px',
              borderStyle: 'solid',
              borderWidth: '1px',
              boxSizing: 'border-box',
            }}
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
