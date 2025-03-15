table! {
    files {
        id -> Nullable<Integer>,
        path -> Text,
        hash -> Text,
        extention -> Text,
        filename -> Text,
        folder_name -> Text,
        width -> Integer,
        height -> Integer,
        tags -> Nullable<Text>,
        root -> Text,
    }
}
