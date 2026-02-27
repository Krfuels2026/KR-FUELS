/**
 * Reminders Page Wrapper - Uses Convex (PoC)
 * This wrapper connects the Reminders UI component to Convex backend
 */

import React from 'react';
import Reminders from './Reminders';
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder, convexToFrontend, type ConvexReminder } from '../convex-api';
import type { Reminder } from '../types';

const RemindersConvex: React.FC = () => {
  // Real-time subscription to reminders from Convex
  const convexReminders = useReminders();
  
  // Mutations
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  // Convert Convex format to frontend format
  const reminders: Reminder[] = convexReminders
    ? convexReminders.map((r: ConvexReminder) => convexToFrontend(r))
    : [];

  // Handler: Add reminder
  const handleAddReminder = async (reminder: Partial<Reminder>) => {
    try {
      await createReminder({
        title: reminder.title || 'Untitled',
        description: reminder.description || '',
        reminderDate: reminder.reminderDate || new Date().toISOString().split('T')[0],
        dueDate: reminder.dueDate || new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Failed to create reminder:', error);
      alert('Failed to create reminder: ' + (error.message || 'Unknown error'));
    }
  };

  // Handler: Update reminder
  const handleUpdateReminder = async (reminder: Reminder) => {
    try {
      await updateReminder({
        id: reminder.id as any, // Convex ID
        title: reminder.title,
        description: reminder.description || '',
        reminderDate: reminder.reminderDate,
        dueDate: reminder.dueDate,
      });
    } catch (error: any) {
      console.error('Failed to update reminder:', error);
      alert('Failed to update reminder: ' + (error.message || 'Unknown error'));
    }
  };

  // Handler: Delete reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder({
        id: id as any, // Convex ID
      });
    } catch (error: any) {
      console.error('Failed to delete reminder:', error);
      alert('Failed to delete reminder: ' + (error.message || 'Unknown error'));
    }
  };

  // Show loading state while data is being fetched
  if (convexReminders === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading reminders...</div>
      </div>
    );
  }

  return (
    <Reminders
      reminders={reminders}
      onAddReminder={handleAddReminder}
      onUpdateReminder={handleUpdateReminder}
      onDeleteReminder={handleDeleteReminder}
    />
  );
};

export default RemindersConvex;
