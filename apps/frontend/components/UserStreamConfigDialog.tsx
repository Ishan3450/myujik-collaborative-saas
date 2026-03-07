"use client"

import { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


/**
 * UserStreamConfigDialog component
 * 
 * This component handles user permission requests for audio autoplay functionality.
 * Modern browsers restrict autoplay of audio content unless the user has explicitly
 * interacted with the page. This dialog prompts users to grant permission for a specific
 * stream.
 * 
 * Named this component as UserStreamConfigDialog as in future
 * I am planning to add stream related configuration.
 */
interface UserStreamConfigDialogProps {
    showDialog: boolean;
    setShowDialog: Dispatch<SetStateAction<boolean>>;
    leaveRoom: () => void;
}

export default function UserStreamConfigDialog({ showDialog, setShowDialog, leaveRoom }: UserStreamConfigDialogProps) {
    const handleConfirm = () => {
        setShowDialog(false);
    }
    const handleCancel = () => {
        leaveRoom();
    }

    return (
        <Dialog open={showDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-xl">Ready to listen?</DialogTitle>
                    <DialogDescription className="text-base">
                        To enable audio playback, we need your permission. This interaction
                        allows the browser to unmute and autoplay audio without restrictions.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant={"outline"} onClick={handleCancel}>Cancel</Button>
                    <Button type="button" onClick={handleConfirm}>Enable Audio</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
