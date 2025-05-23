import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogHeaderProgrammaticClose, DialogTitle, DialogTrigger } from "libComponents/Dialog";
import { Filter, IFilterData } from "libComponents/Filter";
import { cn } from "libs/utils";

type ModalProps = {
  triggerOpen?: boolean;
  triggerOnClose?: any;
  openTrigger?: React.ReactNode;
  modalClassName?: string;
  titleClassName?: string;
  title?: string;
  descriptionClassName?: string;
  description?: string;
  closeOnOverlayClick?: boolean; //when false it prevents the closing of the modal when clicking outside the modal
  hasFilter?: boolean;
  filterData?: Array<IFilterData>;
  children?: React.ReactNode;
};

//NOTE : To activate the Dialog component from within a Context Menu or Dropdown Menu, you must encase the Context Menu or Dropdown Menu component in the Dialog component.
export const Modal: React.FC<ModalProps> = (props) => {
  const {
    triggerOpen,
    triggerOnClose,
    openTrigger,
    modalClassName,
    titleClassName,
    title,
    descriptionClassName,
    description,
    closeOnOverlayClick,
    hasFilter,
    filterData,
    children,
  } = props;
  return (
    <>
      {triggerOpen ? (
        <Dialog
          open={triggerOpen}
          onOpenChange={(changedToVal: any) => {
            // user clicked on the X close header button of DialogHeaderProgrammaticClose
            if (changedToVal === false) {
              triggerOnClose();
            }
          }}>
          {openTrigger && <DialogTrigger asChild>{openTrigger}</DialogTrigger>}
          <DialogContent
            className={cn("max-w-[80%] min-h-[40%] max-h-[90svh] !pt-0 rounded-lg border-foreground", modalClassName)}
            onPointerDownOutside={(e) => !closeOnOverlayClick && e.preventDefault()}>
            <DialogHeaderProgrammaticClose className="text-left sticky flex md:flex-row flex-col justify-between md:items-center items-start md:p-0 p-3 backdrop-blur bg-background/60 w-full border-b border-foreground z-10">
              <div className="flex flex-col w-auto text-left">
                {title ? <DialogTitle className={titleClassName}>{title}</DialogTitle> : <></>}
                {description ? <DialogDescription className={descriptionClassName}>{description}</DialogDescription> : <></>}
              </div>
              {hasFilter ? <Filter filterData={filterData ?? []} /> : <></>}
              <div></div>
            </DialogHeaderProgrammaticClose>
            <div className="overflow-x-hidden overflow-y-auto scrollbar max-h-[80dvh] bg-background">{children}</div>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog>
          {openTrigger && <DialogTrigger asChild>{openTrigger}</DialogTrigger>}
          <DialogContent
            className={cn("max-w-[80%] min-h-[40%] max-h-[90svh] !pt-0 rounded-lg border-foreground", modalClassName)}
            onPointerDownOutside={(e) => !closeOnOverlayClick && e.preventDefault()}>
            <DialogHeader className="text-left sticky flex md:flex-row flex-col justify-between md:items-center items-start md:p-0 p-3 backdrop-blur bg-background/60 w-full border-b border-foreground z-10">
              <div className="flex flex-col w-auto text-left">
                {title ? <DialogTitle className={titleClassName}>{title}</DialogTitle> : <></>}
                {description ? <DialogDescription className={descriptionClassName}>{description}</DialogDescription> : <></>}
              </div>
              {hasFilter ? <Filter filterData={filterData ?? []} /> : <></>}
              <div></div>
            </DialogHeader>
            <div className="overflow-x-hidden overflow-y-auto scrollbar max-h-[80dvh] bg-background">{children}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
