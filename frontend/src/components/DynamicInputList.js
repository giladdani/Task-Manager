import React, { useState } from "react";
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
                            <input
                                disabled={props.disabled}
                                name="value"
                                type="text"
                                value={item.value}
                                onChange={(e) => handleChange(e, index)}
                            />
                            {inputList.length !== 1 && (
                                <button
                                    disabled={props.disabled}
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="remove-btn"
                                >
                                    <span>Remove</span>
                                </button>
                            )}
                        </div>
                        <div className="second-division">
                            {inputList.length - 1 === index && (
                                <button
                                    disabled={props.disabled}
                                    type="button"
                                    onClick={handleAdd}
                                    className="add-btn"
                                >
                                    <span>Add a user</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))
            }
        </div >
    )

    return temp1;
}