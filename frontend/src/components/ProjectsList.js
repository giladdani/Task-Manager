import * as React from 'react';
import { Project } from './Project';

export class ProjectsList extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            projects: []
        }
    }

    async componentDidMount() {
        const projects = await this.fetchProjects();
        this.setState({projects: projects});
    }

    fetchProjects = async() => {
        const response = await fetch('http://localhost:3001/api/projects', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem("access_token")
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching constraints')
            const data = await response.json();
            return data;
    }    

    render(){
        const projects = this.state.projects.map((project, index) => {
            return <li key={index}><Project project={project}></Project></li>
        });

        return(
            <ul>
                {projects}
            </ul>
        )
    }
}