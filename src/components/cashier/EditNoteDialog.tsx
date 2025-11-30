import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNote?: string;
  onSave: (note: string) => void;
  itemName: string;
}

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
  open,
  onOpenChange,
  initialNote = "",
  onSave,
  itemName,
}) => {
  const [note, setNote] = useState(initialNote);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastResultIndexRef = useRef<number>(0);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";

        // Only process results from the last processed index onwards
        for (
          let i = lastResultIndexRef.current;
          i < event.results.length;
          i++
        ) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
            lastResultIndexRef.current = i + 1;
          }
        }

        if (finalTranscript) {
          setNote((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      lastResultIndexRef.current = 0;
    } else {
      lastResultIndexRef.current = 0;
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your instructions now.",
      });
    }
  };

  const handleSubmit = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    onSave(note.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Special Instructions for {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Special Instructions</Label>
            <div className="relative">
              <Textarea
                id="note"
                placeholder="E.g., Extra spicy, No onions, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="pr-12"
              />
              <Button
                type="button"
                size="icon"
                variant={isListening ? "destructive" : "secondary"}
                className="absolute right-2 top-2"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-muted-foreground animate-pulse">
                🎤 Listening... Speak now
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
