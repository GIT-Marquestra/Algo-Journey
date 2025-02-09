
export const getDuration = (start: string, end: string) => {
    const startTimeString = start;
    const endTimeString = end;

    const startTime = new Date(startTimeString);
    const endTime = new Date(endTimeString);


    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error("Invalid date format");
    } else {
    const diffMs = endTime.getTime() - startTime.getTime(); 

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return (`${hours}h ${minutes}m ${seconds}s`);
    }
}
export const getDurationUlt = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error("Invalid date format");
        return null; // Return null if invalid
    }

    const diffMs = endTime.getTime() - startTime.getTime(); 
    return diffMs / (1000 * 60 * 60); // Convert to hours
};