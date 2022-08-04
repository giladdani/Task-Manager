import React, { useState } from 'react';
import { Constraint } from './Constraint';

export class ConstraintsList extends React.Component {
    constructor(props) {
        super(props);
    }  

    render() {
        const constraints = this.props.constraints.map((constraint, index) => {
            return <li key={index}><Constraint
                constraint={constraint}
                handleConstraintUpdate = { this.props.handleConstraintUpdate }
                handleConstraintDelete = { this.props.handleConstraintDelete }
            ></Constraint></li>
        });

        return (
            <ul>
                {constraints}
            </ul>
        )
    }
}


