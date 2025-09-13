table! {
    files {
        id -> Nullable<Integer>,
        path -> Text,
        hash -> Text,
        extension -> Text,
        filename -> Text,
        folder_name -> Text,
        width -> Integer,
        height -> Integer,
        tags -> Nullable<Text>,
        root -> Text,
    }
}
