import { FC, useState, forwardRef } from "react";
import CloseIcon from '@rsuite/icons/Close';
import { getChat } from "./Utils";
import { Button, Col, Container, FlexboxGrid, Loader, Panel, Input, Form, SelectPicker, IconButton, Slider } from "rsuite";
import FlexboxGridItem from "rsuite/esm/FlexboxGrid/FlexboxGridItem";
import "./Content.less";
import { Message } from "./types";
import { signOut } from "./firebase/firebaseSetup";

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />);
const TextareaTall = forwardRef<HTMLTextAreaElement>((props, ref) => <Input rows={7} {...props} as="textarea" ref={ref} />);

const Content: FC = () => {
    const [messages, setMessages] = useState<Message[]>([{ role: 'user', content: '' }]);
    const [loading, setLoading] = useState<boolean>(false);
    const [temp, setTemp] = useState<number>(0.7);
    const [systemNote, setSystemNote] = useState<string>('You are a helpful assistant.');
    const submit = () => {
        getChat([{ role: 'system', content: systemNote }, ...messages], temp, (resp: Message) => {
            setMessages([...messages, resp]);
            setLoading(false);
        });
        setLoading(true);
    };

    const addMessage = () => {
        setMessages([...messages, { role: 'user', content: '' }]);
    }

    const updateMessageContent = (i: number) => {
        return (m: string) => {
            messages[i].content = m;
            setMessages(messages);
        };
    };

    const updateMessageRole = (i: number) => {
        return (m: string | null) => {
            messages[i].role = m as 'user' | 'assistant';
            setMessages([...messages]);
        };
    };

    const removeMessage = (i: number) => {
        return () => {
            messages.splice(i, 1);
            setMessages([...messages]);
        };
    };

    const renderMessage = (m: Message, i: number) => {
        const data = ['user', 'assistant'].map(
            item => ({ label: item, value: item })
        );
        return (<div className="message" key={i}>
            <SelectPicker data={data} searchable={false} value={m.role} onChange={updateMessageRole(i)} className="picker" cleanable={false} style={{ width: 175 }} />
            <Form.Control name={`message_${i}`} accepter={Textarea} onChange={updateMessageContent(i)} defaultValue={messages[i].content} />
            <IconButton className="remove-btn" icon={<CloseIcon />} onClick={removeMessage(i)} />
        </div>);
    }

    return (
        <div className="content">
            <Container className="container">
                <FlexboxGrid>
                    <FlexboxGridItem as={Col} xs={24} className="header"><h1>GPT-4 Prototyper</h1><Button onClick={signOut}>Log out</Button></FlexboxGridItem>
                    <FlexboxGridItem as={Col} xs={24} md={12} lg={8}>
                        <Panel header="System Note" bordered={true}>
                            <Form fluid>
                                <Form.Control name="systemnote" accepter={TextareaTall} onChange={setSystemNote} value={systemNote} />
                            </Form>
                            <div className="label">Temperature</div>
                            <Slider
                                progress
                                value={temp * 100}
                                onChange={value => {
                                    setTemp(value / 100);
                                }}
                            />
                        </Panel>
                    </FlexboxGridItem>
                    <FlexboxGridItem as={Col} xs={24} md={12} lg={16}>
                        <Form fluid>
                            {messages.map(renderMessage)}
                            {loading ? <div className="loading-holder"><Loader size="md" content="GPT-4 is generating..." /></div> : ''}
                            <div className="button-holder"><Button onClick={addMessage} disabled={loading}>Add message</Button><Button onClick={submit} disabled={loading} appearance="primary">Submit</Button></div>
                        </Form>


                    </FlexboxGridItem>

                </FlexboxGrid>
            </Container>
        </div>
    );
}

export default Content;