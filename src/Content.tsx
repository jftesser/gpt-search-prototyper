import { FC, useState, forwardRef, useEffect, useRef } from "react";
import CloseIcon from '@rsuite/icons/Close';
import { getChat, parseSearches, performSearch } from "./Utils";
import { Button, Col, Container, FlexboxGrid, Loader, Panel, Input, Form, SelectPicker, IconButton, Slider } from "rsuite";
import FlexboxGridItem from "rsuite/esm/FlexboxGrid/FlexboxGridItem";
import "./Content.less";
import { Message } from "./types";
import { signOut } from "./firebase/firebaseSetup";

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />);
const TextareaTall = forwardRef<HTMLTextAreaElement>((props, ref) => <Input rows={7} {...props} as="textarea" ref={ref} />);

type WaitingForGPTState = {
    state: 'waiting',
    messages: Message[],
}

type ResolvedState = {
    state: 'resolved',
    messages: Message[],
}

type SearchingState = {
    state: 'searching',
    messages: Message[],
}

type State = WaitingForGPTState | ResolvedState | SearchingState;

const Content: FC = () => {
    const [state, setState] = useState<State>({ state: 'resolved', messages: [{ role: 'user', content: '' }] });

    const [systemNote, setSystemNote] = useState<string>(`You are a helpful assistant who is able to search for information the user is interested in.
You can perform a search by using a search tag like this: [search: query]. Do this whenever the user asks you a question, especially if you think you don't have access to the relevant files or information. Searching can give you direct access to relevant information or files.
Information from the search will be included in a results tag like this: [results: relevant information from the search].
Use these search results in combination with your own expert knowledge to reply to the user. Replies to the user should go in reply tags that look like this: [reply: your message to the user]. Only messages inside this tag will be seen by the user.`);

    const submit = useCallback(() => {
        // getChat([{ role: 'system', content: systemNote }, ...messages], temp, async (resp: Message) => {
        //     setMessages([...messages, resp]);
        //     setLoading(false);
        // });
        // setLoading(true);
    }, [state]);

    useEffect(() => {
        if (messages.length) {

            if (autoSubmit.current) {
                autoSubmit.current = false;
                submit();
            }

            const content = messages[messages.length - 1].content;
            const searches = parseSearches(content);
            if (searches.length) {
                console.log('perform searches');
                const performSearches = async () => {
                    let results: string[] = [];
                    await Promise.all(searches.map(async s => {
                        const result = await performSearch(s);
                        results = results.concat(result);
                    }));
                    if (results.length) {
                        setMessages([...messages, { role: 'assistant', content: `[results: ${results.join(', ')}]` }]);
                        autoSubmit.current = true;
                    }
                };
                performSearches();
            }

        }
    }, [messages]);

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