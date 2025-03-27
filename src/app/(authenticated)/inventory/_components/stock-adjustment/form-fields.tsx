"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Hash, CalendarDays, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldsProps {
    quantity: number;
    onQuantityChange: (value: number) => void;
    referenceNumber: string;
    onReferenceNumberChange: (value: string) => void;
    date: Date;
    onDateChange: (date: Date | undefined) => void;
    notes: string;
    onNotesChange: (value: string) => void;
    unit: string;
    showReferenceRequired: boolean;
}

export function FormFields({
    quantity,
    onQuantityChange,
    referenceNumber,
    onReferenceNumberChange,
    date,
    onDateChange,
    notes,
    onNotesChange,
    unit,
    showReferenceRequired,
}: FormFieldsProps) {
    return (
        <Card className="border-none shadow-sm bg-muted/40 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 h-1"></div>
            <CardContent className="p-3 space-y-2">
                {/* Quantity Field */}
                <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <Hash className="h-3.5 w-3.5" />
                        </div>
                        Quantity
                    </Label>
                    <div className="flex items-center">
                        <Input
                            type="number"
                            className="h-8 text-sm bg-background"
                            value={quantity || ""}
                            onChange={(e) =>
                                onQuantityChange(
                                    Number.parseFloat(e.target.value) || 0
                                )
                            }
                            min={0.01}
                            step={0.01}
                        />
                        <Badge
                            variant="outline"
                            className="ml-2 px-2 py-1 bg-background"
                        >
                            {unit}
                        </Badge>
                    </div>
                </div>

                {/* Reference Number */}
                <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <Hash className="h-3.5 w-3.5" />
                        </div>
                        Reference {!showReferenceRequired && "(Optional)"}
                    </Label>
                    <Input
                        value={referenceNumber}
                        onChange={(e) =>
                            onReferenceNumberChange(e.target.value)
                        }
                        placeholder={
                            showReferenceRequired
                                ? "Invoice/receipt #"
                                : "Optional reference"
                        }
                        className="h-8 text-sm bg-background"
                    />
                </div>

                {/* Date Field */}
                <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <CalendarDays className="h-3.5 w-3.5" />
                        </div>
                        Transaction Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal h-8 w-full text-sm bg-background",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                {date ? (
                                    format(date, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={onDateChange}
                                disabled={(date) => {
                                    return (
                                        date > new Date() ||
                                        date < new Date("1900-01-01")
                                    );
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Notes Field */}
                <div className="space-y-1 pt-1">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <FileText className="h-3.5 w-3.5" />
                        </div>
                        Notes {!showReferenceRequired && "(Optional)"}
                    </Label>
                    <Textarea
                        placeholder="Additional notes about this transaction"
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        className="resize-none min-h-[40px] text-sm bg-background"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
