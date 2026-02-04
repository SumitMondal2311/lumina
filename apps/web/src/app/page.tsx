"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import * as React from "react";

export default function Page() {
    const [name, setName] = React.useState("Anonymous");

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        alert(`Hello, ${name}`);
    };

    return (
        <div className="min-h-screen grid place-items-center">
            <form onSubmit={handleSubmit} className="w-96 space-y-4">
                <Input
                    placeholder="name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                />
                <Button type="submit" className="w-full">
                    Greet
                </Button>
            </form>
        </div>
    );
}
