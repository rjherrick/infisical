import { useEffect } from "react";
import { useRouter } from "next/router"

import SecurityClient from '@app/components/utilities/SecurityClient';

export default function LoginProviderSuccess() {
    const router = useRouter();

    useEffect(() => {
        const { state } = router.query;
        SecurityClient.setProviderAuthToken(state as string);
        window.close();
    }, [])

    return <div />
}
