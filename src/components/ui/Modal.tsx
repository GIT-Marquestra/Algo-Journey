"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ModalProps {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal = ({ trigger, title, children, className = "" }: ModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] ${className}`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;