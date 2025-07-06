import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

interface DateDropdownsProps {
  label: string;
  selectedMonth: number;
  selectedDay: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onDayChange: (day: number) => void;
  onYearChange: (year: number) => void;
}

const DateDropdowns: React.FC<DateDropdownsProps> = ({
  label,
  selectedMonth,
  selectedDay,
  selectedYear,
  onMonthChange,
  onDayChange,
  onYearChange,
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 33 }, (_, i) => currentYear - i);
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedMonth - 1, selectedYear) },
    (_, i) => i + 1
  );

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Row>
        <Col>
          <Form.Select
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            size="sm"
            aria-label="Month"
          >
            <option value="">Month</option>
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col>
          <Form.Select
            value={selectedDay}
            onChange={(e) => onDayChange(parseInt(e.target.value))}
            size="sm"
            aria-label="Day"
          >
            <option value="">Day</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col>
          <Form.Select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            size="sm"
            aria-label="Year"
          >
            <option value="">Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
    </Form.Group>
  );
};

export default DateDropdowns;
