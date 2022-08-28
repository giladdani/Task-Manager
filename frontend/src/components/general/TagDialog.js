import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MultipleSelectChip from './MultipleSelectChip';
import Select from '@mui/material/Select';
const TagsAPI = require('../../apis/TagsAPI.js');
const APIUtils = require('../../apis/APIUtils.js')

export default function TagDialog(props) {
    const [allUserTags, setAllUserTags] = useState([]);
    const [selectedTagIds, setSelectedTagsIds] = useState(props.selectedTagIds);
    const [selectedTags, setSelectedTags] = useState([]);
    const [newTagTitle, setNewTagTitle] = useState("");

    useEffect(() => {
        initiateTags();
    }, [])

    useEffect(() => {
        markSelectedTags();
    }, [allUserTags])

    useEffect(() => {
        props.onTagsUpdate(selectedTagIds);
    }, [selectedTagIds])

    async function initiateTags() {
        await fetchAndSetAllTags();
        markSelectedTags();
    }

    async function fetchAndSetAllTags() {
        TagsAPI.fetchTagsData()
            .then(tags => {
                setAllUserTags(tags);
            })
            .catch(err => {
                console.error(err);
                // TODO: notification error, get in props
            })
    }

    function markSelectedTags() {
        let selectedTags = [];

        for (const selectedId of selectedTagIds) {
            let tag = allUserTags.find(element => element.id === selectedId);
            if (tag) {
                selectedTags.push(tag);
            }
        }

        setSelectedTags(selectedTags);
    }

    const handleCreate = () => {
        TagsAPI.createTag(newTagTitle)
            .then(response => {
                if (APIUtils.isValidStatus(response, TagsAPI.validStatusArr_createTag)) {
                    fetchAndSetAllTags();
                    markSelectedTags();
                    props.setNotificationMsg("Tag created");
                } else {
                    props.setNotificationMsg("Failed to create, name must be unique"); // TODO: get the server response?
                }
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg("Failed to create"); // TODO: get the server response?
            })
    }

    // const handleSave = () => {
    //     handleUpdate();
    // }

    const handleClose = () => {
        // TODO: change to X
        props.onClose();
    }

    const onSelectChange = (selected) => {
        let selectedIds = [];

        if (selected) {
            for (const element of selected) {
                if (element.id) selectedIds.push(element.id);
            }
        }

        setSelectedTagsIds(selectedIds);
        // handleUpdate();
    }

    // Moved this to useEffect, delete if all works well
    function handleUpdate() {
        props.onTagsUpdate(selectedTagIds);
    }

    return (
        <>
            <Dialog
                open={props.isOpen}
                onClose={handleClose}
                aria-labelledby="draggable-dialog-title"
                PaperComponent={PaperComponent} BackdropProps
                ={{ style: { backgroundColor: "transparent" } }}
                disableScrollLock
                disableRestoreFocus
            >
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Edit tags</DialogTitle>
                <DialogContent>
                    <table>
                        <tbody>
                            <tr>
                                <td>Tags:</td>
                            </tr>
                            <tr>
                                <td>
                                    {/* <form> */}
                                    <MultipleSelectChip items={allUserTags} selectedItems={selectedTags} onSelectChange={onSelectChange}></MultipleSelectChip>
                                    {/* </form> */}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <TextField label="Tag name" value={newTagTitle} onChange={(newValue) => setNewTagTitle(newValue.target.value)} size="small" autoFocus />
                                </td>
                                <td>
                                    <Button onClick={handleCreate} variant="contained" color="primary">Create New</Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DialogContent>
                <DialogActions>
                    {/* <Button onClick={handleSave} variant="contained" color="secondary">Save</Button>  */}
                    <Button onClick={handleClose} variant="contained" color="secondary">Cancel</Button>
                    {/* <Button onClick={handleCreate} variant="contained" color="primary">Create New</Button> */}
                </DialogActions>
            </Dialog>
        </>
    );
}

// PaperComponent allows dragging the dialog
function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}