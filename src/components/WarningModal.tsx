import Modal, { ModalProps } from "@/components/ui/Modal";
import { Alert } from "@/components/icons";
import { Button } from "./ui";

type WarningModalProps = Omit<ModalProps, "children"> & {
  onConfirm: () => void;
};

const WarningModal = ({ onConfirm, ...rest }: WarningModalProps) => {
  const { onClose } = rest;

  const onReset = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal {...rest}>
      <div className="px-32 py-12">
        <div className="flex flex-col max-w-[387px] items-center ">
          <Alert className="text-[290px] text-red" />
          <p className="text-display font-bold">WARNING</p>
          <p className="text-center text-black-75 mt-2">
            You’re about to reset whole process. Are you sure you want to do it?
          </p>
          <div className="mt-12 flex gap-4">
            <Button
              onClick={onClose}
              className="text-black-100 bg-transparent hover:bg-black-25"
            >
              Cancel
            </Button>
            <Button onClick={onReset}>Reset</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WarningModal;
