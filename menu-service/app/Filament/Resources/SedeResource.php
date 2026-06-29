<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SedeResource\Pages;
use App\Models\Sede;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class SedeResource extends Resource
{
    protected static ?string $model = Sede::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationLabel = 'Sedes';

    protected static ?string $modelLabel = 'Sede';

    protected static ?string $pluralModelLabel = 'Sedes';

    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form->schema([
            TextInput::make('name')
                ->label('Nombre')
                ->required()
                ->maxLength(120)
                ->live(debounce: 500)
                ->afterStateUpdated(fn ($state, callable $set) => $set('slug', Str::slug($state))),

            TextInput::make('slug')
                ->label('Slug')
                ->required()
                ->unique(ignoreRecord: true)
                ->maxLength(60),

            TextInput::make('whatsapp_phone')
                ->label('WhatsApp')
                ->helperText('Solo dígitos con código de país, ej. 573001234567')
                ->tel()
                ->maxLength(20),

            TextInput::make('address')
                ->label('Dirección')
                ->nullable()
                ->maxLength(200),

            TextInput::make('sort_order')
                ->label('Orden')
                ->numeric()
                ->default(0),

            Toggle::make('is_active')
                ->label('Activa')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('sort_order')->label('Orden')->sortable(),
                TextColumn::make('name')->label('Nombre')->searchable(),
                TextColumn::make('whatsapp_phone')->label('WhatsApp')->color('gray'),
                TextColumn::make('tables_count')->label('Mesas')->counts('tables'),
                IconColumn::make('is_active')->label('Activa')->boolean(),
            ])
            ->defaultSort('sort_order')
            ->actions([EditAction::make(), DeleteAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListSedes::route('/'),
            'create' => Pages\CreateSede::route('/create'),
            'edit'   => Pages\EditSede::route('/{record}/edit'),
        ];
    }
}
