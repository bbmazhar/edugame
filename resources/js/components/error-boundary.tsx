import { Component } from 'react';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    fallback: ReactNode;
};

type State = {
    hasError: boolean;
};

/** Catches runtime errors in a subtree and shows a friendly fallback. */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}
