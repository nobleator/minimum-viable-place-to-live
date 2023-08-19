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

const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const filterTagValues = async (inputValue: string, callback: (options: Option[]) => void) => {
    try {
      // Docs: "https://taginfo.openstreetmap.org/taginfo/apidoc#api_4_keys_all";
      const url = `https://taginfo.openstreetmap.org/api/4/keys/all?page=1&rp=20&sortame=key&sortorder=asc&query=${inputValue}`;
      const response = await axios.get(url);
      const matchingOptions = response.data.data.map((tag) => ({
        value: tag.key,
        label: tag.key,
      }));
      callback(matchingOptions);
    } catch (error) {
      console.log('Error fetching tags:', error);
      callback([]);
    }
  };

// TODO: Convert tagKey and tagValue to common object with explicit fields. Requires update to node change tracking.
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

  const renderValueNode = (node) => {
    return (
      <li key={node.id}>
        <div style={{display: 'flex'}}>
          {/* 
          TODO:
          Add additional dropdown for tag key in addition to the tag value.
          Populate dropdown with most common combination by default, but allow user to modify.
          1) Search by tag value, e.g. grocery, sorting by count_all desc.
          2) Populate tag key options with top 10-20 most common tag keys associated to tag value
          */}
          <AsyncCreatableSelect
            cacheOptions
            defaultOptions
            value={{value: node.tagKey, label: node.tagKey}}
            loadOptions={debounce(filterTagValues, 500)}
            onChange={(e: any) => onNodeFieldChange(node.id, 'tagKey', e.value)}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                display: 'flex',
                width: '10em',
              }),
            }}
          />
          <AsyncCreatableSelect
            cacheOptions
            defaultOptions
            value={{value: node.tagValue, label: node.tagValue}}
            loadOptions={debounce(filterTagValues, 500)}
            onChange={(e: any) => onNodeFieldChange(node.id, 'tagValue', e.value)}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                display: 'flex',
                width: '15em',
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
              width: '6em',
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
