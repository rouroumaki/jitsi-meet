import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { hideDialog } from "../../../base/dialog/actions";
import Dialog from "../../../base/ui/components/web/Dialog";
import Input from "../../../base/ui/components/web/Input";

interface IProps {
    onSubmit: (url: string) => void;
}

export default function SharedIframeDialog({ onSubmit }: IProps) {
    const dispatch = useDispatch();
    const [url, setUrl] = useState("");

    return (
        <Dialog
            disableAutoHideOnSubmit={true}
            ok={{
                disabled: false,
                translationKey: "dialog.Share",
            }}
            onSubmit={() => {
                onSubmit(url.trim());
                dispatch(hideDialog());
            }}
            title="Share Livedoc"
        >
            <Input
                autoFocus={true}
                className="dialog-bottom-margin"
                error={false}
                id="shared-video-url-input"
                label={"Share Livedoc"}
                name="sharedVideoUrl"
                onChange={setUrl}
                placeholder={"https://example.com"}
                type="text"
                value={url}
            />
        </Dialog>
    );
}
