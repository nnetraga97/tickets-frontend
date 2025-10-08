import React from "react";
import { useLogger } from '../store/logger';

type State = {
    hasError: boolean;
    message?: string;
};

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    static contextType = React.createContext(null);
    state: State = {
        hasError: false
    };

    override componentDidCatch(error: unknown) {
        import("../store/logger").then(({ logErrorDirect }) => {
            logErrorDirect('react_error_boundary', error);
        });
        this.setState({ hasError: true, message: (error as Error)?.message });
    }
    override render() {
        if (this.state.hasError) {
            return (
                <div className="mx-auto max-w-2xl p-6 text-center">
                    <h1 className="text-2xl font-semibold mb-2">Something went wrong.</h1>
                    <p className="text-neutral-600 mb-4">{this.state.message || 'An unexpected error occurred.'}</p>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Go to Home
                    </button>
                </div>

            );
        }
        return this.props.children;
    }
}

export function ErrorBoundaryHint() {
    const { logError } = useLogger();
    return (
        <button
            onClick={() => logError("test_error_button", new Error("Test error from button"))}
            className="hidden"
        />
    );
}

