import { FC, useState, forwardRef, useCallback, useEffect } from "react";
import CloseIcon from '@rsuite/icons/Close';
import { getChat, parseSearches } from "./Utils";
import { Button, Col, Container, FlexboxGrid, Loader, Panel, Input, Form, SelectPicker, IconButton, Slider } from "rsuite";
import FlexboxGridItem from "rsuite/esm/FlexboxGrid/FlexboxGridItem";
import "./Content.less";
import { Message } from "./types";
import { signOut } from "./firebase/firebaseSetup";
import { testDocument } from "./testDoc";
import * as snippet from "./snippet";

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
    const loading = state.state !== 'resolved';
    const [temp, setTemp] = useState<number>(0.7);
    const [performSearch, setPerformSearch] = useState<Function | null>(null);
    const [systemNote, setSystemNote] = useState<string>(`You are a helpful assistant who communicates inside of tags such as [search: description of the machine] and [reply: the machine is a way of producing text]. You have a special ability to search relevant data sources for the information the user is interested in.
You can perform a search by using a search tag like this: [search: the capital of France]. Do this whenever the user asks you a question, especially if you think you don't have access to the relevant files or information. Searching can give you direct access to relevant information or files.
Information from the search will be included in a result tags like this: [result: the capital of France is Paris]. When you see a result tag you should use it to answer the user.
Make sure to use the search results to answer the question. The search results are to be trusted completely. When you have a search result you should try to use it reply to the user. Replies to the user should go in reply tags that look like this: [reply: your message to the user]. Only messages inside this tag will be seen by the user.`);
    const [documentContent, setDocumentContent] = useState<string>(testDocument);
    const [docState, setDocState] = useState<'unset' | 'loading' | 'loaded'>('unset');

    const submit = useCallback(() => {
        console.assert(state.state === 'resolved');
        setState({ state: 'waiting', messages: [...state.messages] });
        const sumbitToAPI = async () => {
            const messages = [...state.messages];

            const genMessage = async () => {
                const newMessage = await getChat([{ role: 'system', content: systemNote }, ...messages], temp);
                messages.push(newMessage);
                return newMessage;
            }
            const genMessageAndGetSearches = async () => {
                const newMessage = await genMessage();
                return parseSearches(newMessage.content);
            }
            let searches = await genMessageAndGetSearches();
            while (searches.length && performSearch) {
                setState({ state: 'searching', messages });

                //const performSearch = await (await snippet.load())(documentContent);

                let results: string[] = [];
                await Promise.all(searches.map(async s => {
                    const result = await performSearch(s);
                    results = results.concat(result);
                }));
                if (results.length) {
                    messages.push({ role: 'assistant', content: [...results.map((x) => `[result: ${x}]`), "[thought: I should use this information to reply to the user]"].join("\n\n") });
                    setState({ state: 'waiting', messages });
                    searches = await genMessageAndGetSearches();
                } else {
                    searches = [];
                }
            }
            setState({ state: 'resolved', messages });
        };
        sumbitToAPI();

    }, [state.state, state.messages, systemNote, temp, performSearch]);

    const addMessage = () => {
        setState({ state: 'resolved', messages: [...state.messages, { role: 'user', content: '' }] });
    }

    const updateMessageContent = useCallback((i: number) => {
        return (m: string) => {
            console.assert(state.state === 'resolved');
            state.messages[i].content = m;
            setState({ state: 'resolved', messages: [...state.messages] });
        };
    }, [state]);

    const updateMessageRole = useCallback((i: number) => {
        return (m: string | null) => {
            console.assert(state.state === 'resolved');
            state.messages[i].role = m as 'user' | 'assistant';
            setState({ state: 'resolved', messages: [...state.messages] });
        };
    }, [state]);

    const removeMessage = useCallback((i: number) => {
        return () => {
            console.assert(state.state === 'resolved');
            state.messages.splice(i, 1);
            setState({ state: 'resolved', messages: [...state.messages] });
        };
    }, [state]);

    useEffect(() => {
        const loadNewDoc = async () => {
            setDocState('loading');
            console.log('updating doc');
            const searchFunc = await (await snippet.load())(documentContent);
            setPerformSearch(() => searchFunc);
            setDocState('loaded');
            console.log('doc updated');
        };
        if (documentContent) loadNewDoc();
    }, [documentContent]);
        

    const renderMessage = (m: Message, i: number) => {
        const data = ['user', 'assistant'].map(
            item => ({ label: item, value: item })
        );
        return (<div className="message" key={i}>
            <SelectPicker data={data} searchable={false} value={m.role} onChange={updateMessageRole(i)} className="picker" cleanable={false} style={{ width: 175 }} disabled={loading} />
            <Form.Control name={`message_${i}`} accepter={Textarea} onChange={updateMessageContent(i)} defaultValue={state.messages[i].content} disabled={loading} />
            <IconButton className="remove-btn" icon={<CloseIcon />} onClick={removeMessage(i)} disabled={loading} />
        </div>);
    }

    return (
        <div className="content">
            <Container className="container">
                <FlexboxGrid>
                    <FlexboxGridItem as={Col} xs={24} className="header"><h1>GPT-4 Search Prototyper</h1><Button onClick={signOut}>Log out</Button></FlexboxGridItem>
                    <FlexboxGridItem as={Col} xs={24} md={12} lg={8}>
                        <Panel className="panel" header="System Note" bordered={true}>
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
                        <Panel className="panel" header="Document to Search" bordered={true}>
                            <Form fluid>
                                <Form.Control name="document" accepter={TextareaTall} onChange={setDocumentContent} value={documentContent} />
                            </Form>
                        </Panel>
                    </FlexboxGridItem>
                    <FlexboxGridItem as={Col} xs={24} md={12} lg={16}>
                        <Form fluid>
                            {state.messages.map(renderMessage)}
                            {loading ? <div className="loading-holder"><Loader size="md" content={state.state === 'searching' ? "Searching your document..." : "GPT-4 is generating..."} /></div> : ''}
                            {docState === "loading" ? <div className="loading-holder"><Loader size="md" content="Analyzing your document" /></div> : ''}
                            <div className="button-holder"><Button onClick={addMessage} disabled={loading}>Add message</Button><Button onClick={submit} disabled={loading} appearance="primary">Submit</Button></div>
                        </Form>


                    </FlexboxGridItem>

                </FlexboxGrid>
            </Container>
        </div>
    );
}

export default Content;