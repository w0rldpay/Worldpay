import React, { Component } from 'react';
import { Form, Button, Input, Message, Container } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import lotteryFactoryAt from '../../ethereum/factory';
import web3 from '../../ethereum/web3';
import web3Socket from '../../ethereum/web3Socket';
import { Router } from '../../routes';

class LotteryNew extends Component {

    state = {
        duration: "",
        entranceValue: "",
        errorMessage: "",
        loading: false,
        factoryAddress: this.props.url.query.factoryAddress, 
        accounts: [],
        lotteryFactory: ""
    }

    componentDidMount() {
        if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
            this.handleLoad(this.state.factoryAddress);
        } else {
            window.addEventListener('load', () => {
                this.handleLoad(this.state.factoryAddress);
            }, false);
        }
    }

    componentWillUnmount() {
        this.LotteryDeployedEvent.unsubscribe();
    }

    setEventsListeners = () => {
        const lotteryFactory = lotteryFactoryAt(this.state.factoryAddress, web3Socket);
        this.LotteryDeployedEvent = lotteryFactory.events.LotteryDeployed({}, async (error, data) => {
            if(error == null) {
                const address = data.returnValues.deployedLottery;
                Router.pushRoute(`/lotteries/${address}`);
            }
        })
    }

    handleLoad = async (factoryAddress) => {
        this.setEventsListeners();
        const lotteryFactory = lotteryFactoryAt(factoryAddress, web3);
        const accounts = await  web3.eth.getAccounts();
        this.setState({ lotteryFactory, accounts, web3 });
    }

    onSubmit = async (event) => {
        event.preventDefault();
        const lotteryFactory = this.state.lotteryFactory;
        const accounts = this.state.accounts;

        try {
            this.setState({ loading:true, errorMessage:""});
            await lotteryFactory.methods
                .createNewLottery(this.state.duration, web3.utils.toWei(this.state.entranceValue, 'ether'))
                .send({
                    from: accounts[0]
            });
            
        } catch (err) {
            this.setState({ errorMessage: err.message.split("\n")[0] });
        }
        this.setState({ loading:false });
    }

    render() {
        return (
            
            <Layout>
                <Container style={{marginTop:'100px'}} >
                    <h3>New Lottery</h3>

                    <Form onSubmit={ this.onSubmit } error={ !!this.state.errorMessage }>
                        <Form.Group widths="equal">
                            <Form.Field>
                                <label>Duration</label>
                                <Input 
                                    label="Seconds" 
                                    labelPosition="right" 
                                    type="number" 
                                    value={this.state.duration}
                                    onChange={event => 
                                        this.setState({ duration: event.target.value })}
                                />
                            </Form.Field>
                            <Form.Field>
                                <label>Entrance Value</label>
                                <Input label="Eth" 
                                    labelPosition="right"
                                    type="number" 
                                    value={this.state.entranceValue}
                                    onChange={event => 
                                        this.setState({ entranceValue: event.target.value })}
                                />
                            </Form.Field>
                        </Form.Group>
                        <Message error header="Ooops!" content={ this.state.errorMessage } />
                        <Button loading={ this.state.loading } primary>Create!</Button>
                    </Form>
                </Container>
            </Layout>
        ) 
    }
}

export default LotteryNew;