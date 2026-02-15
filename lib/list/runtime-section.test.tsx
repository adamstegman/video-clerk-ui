import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RuntimeSection } from './runtime-section';

describe('RuntimeSection', () => {
  it('renders the section title and minutes label', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={null} onRuntimeChange={onRuntimeChange} />);

    expect(screen.getByText('Runtime')).toBeTruthy();
    expect(screen.getByText('minutes')).toBeTruthy();
  });

  it('displays the current runtime value', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={120} onRuntimeChange={onRuntimeChange} />);

    const input = screen.getByDisplayValue('120');
    expect(input).toBeTruthy();
  });

  it('displays empty input when runtime is null', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={null} onRuntimeChange={onRuntimeChange} />);

    const input = screen.getByDisplayValue('');
    expect(input).toBeTruthy();
  });

  it('calls onRuntimeChange with a number when digits are entered', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={null} onRuntimeChange={onRuntimeChange} />);

    const input = screen.getByDisplayValue('');
    fireEvent.changeText(input, '90');

    expect(onRuntimeChange).toHaveBeenCalledWith(90);
  });

  it('strips non-digit characters from input', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={null} onRuntimeChange={onRuntimeChange} />);

    const input = screen.getByDisplayValue('');
    fireEvent.changeText(input, '12abc34');

    expect(onRuntimeChange).toHaveBeenCalledWith(1234);
  });

  it('calls onRuntimeChange with null when input is cleared', () => {
    const onRuntimeChange = jest.fn();
    render(<RuntimeSection runtime={120} onRuntimeChange={onRuntimeChange} />);

    const input = screen.getByDisplayValue('120');
    fireEvent.changeText(input, '');

    expect(onRuntimeChange).toHaveBeenCalledWith(null);
  });
});
