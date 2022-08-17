import { useState, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Constraint } from './Constraint';
import { ThreeDots } from 'react-loader-spinner'
const ConstraintsAPI = require('../../apis/ConstraintsAPI.js')


const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid white`, '&:not(:last-child)': { borderBottom: 0 }, '&:before': { display: 'none' },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon />}{...props} />))(({ theme }) => ({
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper': {
      marginLeft: theme.spacing(2),
      color: "white"
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)'
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(2)
    }
  }));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid white'
}));

export const ConstraintsAccordion = (props) => {
  const [expanded, setExpanded] = useState('');
  const [allConstraints, setAllConstraints] = useState();
  const componentMounted = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAndSetConstraints();
    }

    fetchData();

    return () => {
      componentMounted.current = false;
    }
  }, []);

  const fetchAndSetConstraints = async () => {
    const constraints = await ConstraintsAPI.fetchConstraints();

    if (componentMounted.current) {
      setAllConstraints(constraints);
    } else {
      console.log(`[ConstraintsAccordion - fetchAndSetConstraints] component is unmounted, not setting constraints!`)
    }
  }

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleConstraintUpdate = async (partialConstraintEvent) => {
    ConstraintsAPI.updateConstraint(partialConstraintEvent)
      .then(async ([response, error]) => {

        // handleResponse() ???

        // TODO: Change the manner of notification. Alert sucks.
        if (error) {
          alert(error)
        } else if (response.status !== 200) {
          // TODO: read body of response. Code here is incorrect.
          const jsonPromise = response.json();
          jsonPromise.then((data) => {
            alert(data);
          })

          alert("Something went wrong :(")
        } else {
          fetchAndSetConstraints();
        }
      }
      )
  }


  // TEST

  // const handleResponse(successMsg, failureMsg, successCallback, failureCallback)
  // {
  //   if (status === 200) {
  //     alert(successmsg);

  //     if (successCallback) {
  //       successCallback()
  //     }

  //     do something (probably just positive notification)
  //   } else {
  //     negative notification
  //   }
  // }




  const handleConstraintDelete = async (constraintID) => {
    ConstraintsAPI.deleteConstraint(constraintID)
      .then(async ([response, error]) => {
        // TODO: Change the manner of notification. Alert sucks.
        if (error) {
          alert(error)
        } else if (response.status !== 200) {
          // TODO: read body of response. Code here is incorrect.
          const jsonPromise = response.json();
          jsonPromise.then((data) => {
            alert(data);
          })

          alert("Something went wrong :(")
        } else {
          fetchAndSetConstraints();
        }
      }
      )
  }

  return (
    <>
      {!allConstraints &&
        <ThreeDots color="#00BFFF" height={80} width={80} />
      }
      {
        allConstraints && allConstraints.length === 0 &&
        <p>You have no constraints</p>
      }
      {allConstraints &&
        allConstraints.map((constraint, index) => {
          return (
            <Accordion expanded={expanded === constraint.title} onChange={handleChange(constraint.title)} key={index}>
              <AccordionSummary>
                <div><b>{constraint.title}</b></div>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  <Constraint
                    constraint={constraint}
                    handleConstraintDelete={handleConstraintDelete}
                    handleConstraintUpdate={handleConstraintUpdate}
                  ></Constraint>
                </div>
              </AccordionDetails>
            </Accordion>
          )
        })
      }
    </>
  );
}