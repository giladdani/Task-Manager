import React, { useState } from "react";
import TextField from '@mui/material/TextField';
import Button from "@material-ui/core/Button";

export const DynamicInputList = (props) => {
    const [inputList, setList] = useState([{ value: "" }]);

    const handleChange = (e, index) => {
        const { name, value } = e.target;
        const list = [...inputList];
        list[index][name] = value;
        setList(list);
        props.updateList(list);
    };

    const handleRemove = (index) => {
        const list = [...inputList];
        list.splice(index, 1);
        setList(list);
    };

    const handleAdd = () => {
        setList([...inputList, { value: "" }]);
    };

    const temp1 = (
        <div>
            {
                inputList.map((item, index) => (
                    <div key={index}>
                        <div className="first-division">
                            <TextField 
                                onChange={(e) => handleChange(e, index)}
                                value={item.value} 
                                name="value" 
                                disabled={props.disabled}
                                placeholder="User email..."
                                variant="outlined"
                                size="small"
                            />
                            {inputList.length !== 1 && (index != inputList.length - 1) && (
                                <Button
                                disabled={props.disabled}
                                onClick={() => handleRemove(index)}
                                variant="contained"
                                size="small">
                                    <span>Remove</span>
                                </Button>
                            )}
                        </div>
                        <div className="second-division">
                            {inputList.length - 1 === index && (
                                <Button
                                disabled={props.disabled}
                                onClick={handleAdd}
                                variant="contained"
                                size="small">
                                    <span>Add a user</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ))
            }
        </div>
    )

    return temp1;
}