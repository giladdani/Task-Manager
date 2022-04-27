import * as React from 'react';
import { Constraint } from './Constraint';

export class ConstraintsList extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            constraints: []
        }
    }

    async componentDidMount() {
        const constraints = await this.fetchConstraints();
        this.setState({constraints: constraints});
    }

    fetchConstraints = async() => {
        const response = await fetch('http://localhost:3001/api/constraints', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': document.cookie
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching constraints')
            const data = await response.json();
            return data;
    }    

    render(){
        const constraints = this.state.constraints.map((constraint, index) => {
            return <li key={index}><Constraint constraint={constraint}></Constraint></li>
        });

        return(
            <ul>
                {constraints}
            </ul>
        )
    }
}