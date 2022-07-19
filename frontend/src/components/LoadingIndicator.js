export const LoadingIndicator = () => {
    const { promiseInProgress } = usePromiseTracker();
    return (
        promiseInProgress && <h1>Hey some async call in progress ! </h1>
    );  
}