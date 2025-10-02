"use client";

import { useAppStore } from "@/lib/store";
import { ECOSYSTEM_LIST, STORAGE_KEYS } from "@/utilities/constants";
import { cacheManager } from "@/utilities/util";
import { useCallback, useMemo, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface EcosystemMultiSelectProps {
  onEcosystemsChange?: (ecosystems: string[]) => void;
}

export default function EcosystemMultiSelect({
  onEcosystemsChange
}: EcosystemMultiSelectProps) {
  const { selectedEcosystems, setSelectedEcosystems } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [tempSelectedEcosystems, setTempSelectedEcosystems] = useState<
    string[]
  >([]);

  const handleOpenModal = useCallback(() => {
    setTempSelectedEcosystems([...selectedEcosystems]);
    setShowModal(true);
  }, [selectedEcosystems]);

  const handleCloseModal = () => {
    setShowModal(false);
    setTempSelectedEcosystems([]);
  };

  const handleEcosystemToggle = useCallback((ecosystemValue: string) => {
    setTempSelectedEcosystems((prev) =>
      prev.includes(ecosystemValue)
        ? prev.filter((eco) => eco !== ecosystemValue)
        : [...prev, ecosystemValue]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allEcosystems = ECOSYSTEM_LIST.map((eco) => eco.value);
    setTempSelectedEcosystems(allEcosystems);
  }, []);

  const handleSelectNone = useCallback(() => {
    setTempSelectedEcosystems([]);
  }, []);

  const handleSave = useCallback(() => {
    setSelectedEcosystems(tempSelectedEcosystems);
    onEcosystemsChange?.(tempSelectedEcosystems);
    setShowModal(false);
    cacheManager.setItem(STORAGE_KEYS.SELECTED_ECO, tempSelectedEcosystems);
  }, [tempSelectedEcosystems, setSelectedEcosystems, onEcosystemsChange]);

  const displayText = useMemo(() => {
    if (selectedEcosystems.length === 0) {
      return "No ecosystems selected";
    }

    if (selectedEcosystems.length === ECOSYSTEM_LIST.length) {
      return "All ecosystems";
    }

    if (selectedEcosystems.length === 1) {
      const ecosystem = ECOSYSTEM_LIST.find(
        (eco) => eco.value === selectedEcosystems[0]
      );
      return ecosystem?.label || selectedEcosystems[0];
    }
    return `${selectedEcosystems.length} Ecosystems`;
  }, [selectedEcosystems]);

  return (
    <>
      <Button variant='outline-secondary' onClick={handleOpenModal} size='sm'>
        <span>{displayText}</span>
        <i className='bi bi-layers ms-2'></i>
      </Button>

      {showModal && (
        <Modal show={true} onHide={handleCloseModal} centered keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className='bi bi-layers me-2'></i>
              Select Ecosystems
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className='d-flex gap-2 mb-3'>
              <Button
                variant='outline-primary'
                size='sm'
                onClick={handleSelectAll}
              >
                <i className='bi bi-check-square me-1'></i>
                Select All
              </Button>
              <Button
                variant='outline-secondary'
                size='sm'
                onClick={handleSelectNone}
              >
                <i className='bi bi-square me-1'></i>
                Select None
              </Button>
            </div>

            <div
              className='border rounded p-3'
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {ECOSYSTEM_LIST.map((ecosystem) => (
                <Form.Check
                  key={ecosystem.value}
                  type='checkbox'
                  id={`ecosystem-${ecosystem.value}`}
                  label={ecosystem.label}
                  checked={tempSelectedEcosystems.includes(ecosystem.value)}
                  onChange={() => handleEcosystemToggle(ecosystem.value)}
                  className='mb-2'
                />
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='secondary' onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant='primary' onClick={handleSave}>
              <i className='bi bi-check-lg me-1'></i>
              Save Selection
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
