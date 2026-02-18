"use client";

import { useCallback } from "react";

import toast from "react-hot-toast";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";


export default function ShareButton({ streamId, className }: { streamId: string | undefined, className?: string }) {
    const shareStream = useCallback(async () => {
        const shareUrl = `${window.location.origin}/stream/${streamId}`;
        try {
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Stream URL copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy URL:", error);
            toast.error("Failed to copy URL. Please try again or manually share the link.");
        }

    }, [streamId]);

    if (!streamId) {
        return null;
    }
    return (
        <Button variant={"outline"} onClick={shareStream} className={className}>
            <Share2 className="h-4 w-4" /> Share Stream
        </Button>
    );
}
