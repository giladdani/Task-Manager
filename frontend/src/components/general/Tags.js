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

export default function Tags(props) {
    const [selectedTagIds, setSeletedTagIds] = useState(props.selectedTagIds);
    const [allUserTags, setAllUserTags] = useState();
    const [selectedTags, setSelectedTags] = useState();

    useEffect(() => {
        fetchAndSetAllTags();
    }, [])

    useEffect(() => {
        findAndSetSelectedTags();
    }, [allUserTags])

    const fetchAndSetAllTags = async () => {
        return TagsAPI.fetchTagsData()
            .then(tags => {
                setAllUserTags(tags);
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg('Failed to fetch tags');
            })
    }

    const findAndSetSelectedTags = () => {
        if (selectedTagIds && allUserTags) {
            let selectedTags = [];
            for (const selectedId of selectedTagIds) {
                let tag = allUserTags.find(tag => tag.id === selectedId);
                if (tag) selectedTags.push(tag);
            }

            setSelectedTags(selectedTags);
        }
    }

    const handleSelectChange = (selected) => {
        let selectedIds = [];

        if (selected) {
            for (const element of selected) {
                if (element.id) selectedIds.push(element.id);
            }
        }

        setSeletedTagIds(selectedIds);
        props.onTagsUpdate(selectedIds);
    }

    return (
        <>
            <label>Tags</label>
            <MultipleSelectChip
                items={allUserTags}
                selectedItems={selectedTags}
                onSelectChange={handleSelectChange}
                disabled={props.disabled}
            ></MultipleSelectChip>

            <MultipleSelectChip
                label="Tags"
                items={allUserTags}
                selectedItems={selectedTags}
                onSelectChange={handleSelectChange}
                disabled={props.disabled}
            ></MultipleSelectChip>

        </>
    )
}