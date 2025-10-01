"use client";

import { ReactNode } from "react";
import { Modal as BootstrapModal } from "react-bootstrap";

interface ModalProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "lg" | "xl";
  centered?: boolean;
  backdrop?: boolean | "static";
  keyboard?: boolean;
  closeButton?: boolean;
  footer?: ReactNode;
  className?: string;
  fullscreen?:
    | boolean
    | "sm-down"
    | "md-down"
    | "lg-down"
    | "xl-down"
    | "xxl-down";
}

export default function Modal({
  show,
  onHide,
  title,
  children,
  size,
  centered = true,
  backdrop = true,
  keyboard = true,
  closeButton = true,
  footer,
  fullscreen = "sm-down",
  className
}: ModalProps) {
  return (
    <BootstrapModal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      fullscreen={fullscreen as any}
      className={`modal-responsive ${className}`}
      enforceFocus={true}
      restoreFocus={true}
      scrollable={true}
    >
      {title && (
        <BootstrapModal.Header
          closeButton={closeButton}
          className='border-bottom'
        >
          <BootstrapModal.Title className='h5 mb-0'>
            {title}
          </BootstrapModal.Title>
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body className='p-3'>{children}</BootstrapModal.Body>
      {footer && (
        <BootstrapModal.Footer className='border-top'>
          {footer}
        </BootstrapModal.Footer>
      )}
    </BootstrapModal>
  );
}
