import { Card } from "@/components/ui/card";


interface WebsocketConnectionLoaderProps {
    title?: string;
    subtitle?: string;
}

export default function WebsocketConnectionLoader({
    title = "Connecting...",
    subtitle = "Setting up and joining the server. Please wait.",
}: WebsocketConnectionLoaderProps) {
    return (
        <Card className="m-auto flex flex-col items-center justify-center p-16 w-fit">
            <div className="mb-4">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
            </div>
            <h2 className="text-lg font-semibold text-center mb-1">
                {title}
            </h2>
            <p className="text-gray-600 text-center grid gap-5">
                <span className="max-w-lg">{subtitle}</span>

                <span className="text-sm max-w-md m-auto">
                    <strong>Note:</strong> Very rarely, the initial load might take up to <span className="text-blue-600 font-medium">40-60 seconds</span> due to inactivity which leads to cloud server cold starts. Subsequent loads will be much faster.
                </span>
            </p>
        </Card>
    );
}
