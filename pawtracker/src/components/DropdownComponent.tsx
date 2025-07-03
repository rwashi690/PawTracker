import React from 'react';
import { Form } from 'react-bootstrap';

type DropdownProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

const DropdownComponent: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {label}</option>
        {options.map((opt, index) => (
          <option key={index} value={opt}>
            {opt}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default DropdownComponent;
