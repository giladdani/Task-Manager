import React from 'react';

export const TagItem = (props) => {
    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td><label>{props.tag.title}</label></td>
                    </tr>
                    <tr>
                        <td><label>Color:</label></td>
                        <td><div className="tagColor" style={{backgroundColor: props.tag.color}}></div></td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}