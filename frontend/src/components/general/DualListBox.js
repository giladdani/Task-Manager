import React, { useState, useEffect } from 'react';


/**
 * Needs to receive two arrays: one for box A (Selected), one for box B (Non-Selected)
 * Each element in the array has to have a field of 'title'.
 * @param {*} props 
 * @returns 
 */
export default function DualListBox(props) {
    const [selectedItems, setSelectedItems] = useState(props.selectedItems);
    const [nonSelectedItems, setNonSelectedItems] = useState(props.nonSelectedItems);

    useEffect(() => {

    }, [])

    function moveFromSelectedToNon(items) {
        removeAndAddToGroup(items, selectedItems, nonSelectedItems);
        updateParentLists();
    }

    function moveFromNonToSelected() {
        removeAndAddToGroup(items, nonSelectedItems, selectedItems);
        updateParentLists();
    }

    function updateParentLists() {
        props.setSelected(selectedItems);
        props.setNonSelected(nonSelectedItems);
    }

    function createTag() {
        // setNonSelected(...nonSelected, newTag);
    }

    function removeAndAddToGroup(items, groupToRemoveFrom, groupToAddTo) {
        // ! EXAMPLE: setTheArray(oldArray => [...oldArray, newElement]);

        /**
         * TODO: find out how to perform this in React:
         * 
         * items.forEach(item => {
         *      remove from grouptoRemove (if found)
         *      add to group to add to (if not found)
         * })
         */
    }

    function onUpdateClick() {
        // props.onUpdate(selectedItems) (check naming) 
    }

    return (
        <>
            <p>Hi I'm a dual listbox!</p>
            <button>Update</button>
        </>
    );
}