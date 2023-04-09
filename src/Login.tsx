import React, { useState } from "react";
import { signIn } from "./firebase/firebaseSetup";
import { Form, Content, Input, Container, Button } from "rsuite";
import "./Login.less";

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            await signIn(email, password);
            onLogin();
        } catch (error) {
            setError(error as any);
        }
    };

    return (
        <Container className="login">
            <Content>
                <h1>Login</h1>
                <Form fluid onSubmit={handleLogin}>
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(v) => setEmail(v)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(v) => setPassword(v)}
                        required
                    />
                    <Button type="submit">Login</Button>
                </Form>
                {error && <p>{error}</p>}
            </Content>
        </Container>
    );
};

export default LoginPage;